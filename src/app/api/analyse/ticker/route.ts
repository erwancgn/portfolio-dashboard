import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { fetchFmpProfile } from '@/lib/fmp'
import {
  extractLastJsonObject,
  normalizeModelText,
  sanitizeModelAnalysis,
} from '@/lib/ai'
import { isSafeTicker, validateTickerAnalysisJson } from '@/lib/ai-validation'

/** Corps de la requête attendu par cette route */
interface TickerRequest {
  ticker: string
}

/** Signal retourné par l'agent */
type Signal = 'BUY' | 'HOLD' | 'SELL'

/** Réponse retournée par cette route */
interface TickerResponse {
  signal: Signal
  score: number
  analysis: string
  ticker: string
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/** Structure JSON attendue dans le dernier bloc JSON de la réponse de Gemini */
interface AgentJsonResponse {
  signal: Signal
  score: number
}

/** Valeurs de signal autorisées */
const VALID_SIGNALS: Signal[] = ['BUY', 'HOLD', 'SELL']

/** System prompt chargé une seule fois au démarrage du module */
const PROMPT_TEMPLATE = fs.readFileSync(
  path.join(process.cwd(), 'src/agents/quick-analyse.md'),
  'utf-8',
)

/**
 * Vérifie qu'une valeur est un signal valide.
 *
 * @param value - Valeur à vérifier
 */
function isValidSignal(value: unknown): value is Signal {
  return typeof value === 'string' && (VALID_SIGNALS as string[]).includes(value)
}

/**
 * Construit le contexte FMP à injecter dans le prompt.
 * Retourne une chaîne vide si le profil est indisponible.
 *
 * @param ticker - Symbole boursier
 */
async function buildFmpContext(ticker: string): Promise<string> {
  const profile = await fetchFmpProfile(ticker)
  if (!profile) return ''

  const lines: string[] = []
  if (profile.sector) lines.push(`Secteur : ${profile.sector}`)
  if (profile.industry) lines.push(`Industrie : ${profile.industry}`)
  if (profile.country) lines.push(`Pays : ${profile.country}`)
  if (profile.description) {
    const truncated = normalizeModelText(profile.description, 220)
    lines.push(`Description : ${truncated}`)
  }

  return lines.length > 0 ? `Contexte FMP:\n${lines.join('\n')}` : ''
}

/**
 * Détecte si une erreur provient d'un dépassement de quota (HTTP 429).
 *
 * @param err - Erreur inconnue capturée dans le catch
 */
function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('429') || err.message.toLowerCase().includes('quota')
  }
  return false
}

/**
 * POST /api/analyse/ticker
 *
 * Corps : { ticker: string }
 * Retourne : { signal: 'BUY' | 'HOLD' | 'SELL', score: number, analysis: string, ticker: string }
 *
 * Lit le system prompt depuis src/agents/quick-analyse.md,
 * enrichit le contexte via FMP, puis appelle Gemini 2.5 Flash-Lite
 * avec Search Grounding activé.
 * La réponse Gemini est un markdown structuré en 5 sections terminé par un bloc JSON.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<TickerResponse | ErrorResponse>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API manquante', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  let body: TickerRequest
  try {
    body = (await request.json()) as TickerRequest
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const ticker = body.ticker?.trim().toUpperCase()
  if (!ticker) {
    return NextResponse.json(
      { error: 'Paramètre manquant : ticker', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }
  if (!isSafeTicker(ticker)) {
    return NextResponse.json(
      { error: 'Ticker invalide', code: 'INVALID_PARAM' },
      { status: 400 },
    )
  }

  // Enrichissement du contexte via FMP
  const fmpContext = await buildFmpContext(ticker)

  // Injection des variables dans le prompt
  const systemPrompt = PROMPT_TEMPLATE
    .replace('{ticker}', ticker)
    .replace('{context}', fmpContext)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(
      `Analyse le titre ${ticker} et retourne uniquement le JSON demandé.`,
    )

    const raw = result.response.text().trim()
    const jsonBlock = extractLastJsonObject(raw)
    if (!jsonBlock) {
      return NextResponse.json(
        { error: 'Format de réponse invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    const parsed = validateTickerAnalysisJson(JSON.parse(jsonBlock) as AgentJsonResponse)
    if (!parsed || !isValidSignal(parsed.signal)) {
      return NextResponse.json(
        { error: 'Structure JSON invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    // Retire le bloc JSON final de l'analyse markdown (signal + score déjà parsés)
    const analysis = sanitizeModelAnalysis(
      raw.slice(0, raw.lastIndexOf(jsonBlock)).trimEnd(),
    )

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse vide retournée par le modèle', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    return NextResponse.json(
      { signal: parsed.signal, score: parsed.score, analysis, ticker },
      { status: 200 },
    )
  } catch (err) {
    if (isQuotaError(err)) {
      return NextResponse.json(
        {
          error: "Plus de tokens disponibles pour l'analyse, revenez plus tard.",
          code: 'QUOTA_EXCEEDED',
        },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de l'appel à Gemini", code: 'AI_ERROR' },
      { status: 503 },
    )
  }
}
