import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'
import { createClient } from '@/lib/supabase/server'

/** Corps de la requête attendu */
interface ClassicRequest {
  ticker: string
  method: 'buffett' | 'lynch'
}

/** Réponse retournée par cette route */
export interface ClassicAnalysisResult {
  ticker: string
  method: 'buffett' | 'lynch'
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  analysis: string
  // Buffett
  moat?: 'wide' | 'narrow' | 'none'
  margin_of_safety?: number
  verdict?: string
  // Lynch
  peg?: number | null
  category?: string
  story?: 'strong' | 'moderate' | 'weak'
  computed_at: string
  from_cache: boolean
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/** Structure JSON Buffett dans la réponse Gemini */
interface BuffettJson {
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  moat: 'wide' | 'narrow' | 'none'
  margin_of_safety: number
  verdict: string
}

/** Structure JSON Lynch dans la réponse Gemini */
interface LynchJson {
  signal: 'BUY' | 'HOLD' | 'SELL'
  score: number
  peg: number | null
  category: string
  story: 'strong' | 'moderate' | 'weak'
  verdict: string
}

type GeminiJson = BuffettJson | LynchJson

const VALID_SIGNALS = ['BUY', 'HOLD', 'SELL'] as const
const VALID_METHODS = ['buffett', 'lynch'] as const

/** Prompts chargés une seule fois au démarrage du module */
const PROMPT_BUFFETT = fs.readFileSync(
  path.join(process.cwd(), 'src/agents/buffett-analyse.md'),
  'utf-8',
)
const PROMPT_LYNCH = fs.readFileSync(
  path.join(process.cwd(), 'src/agents/lynch-analyse.md'),
  'utf-8',
)

/**
 * Vérifie qu'une erreur est un dépassement de quota Gemini (HTTP 429).
 */
function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    return err.message.includes('429') || err.message.toLowerCase().includes('quota')
  }
  return false
}

/**
 * POST /api/analyse/classic
 *
 * Corps : { ticker: string, method: 'buffett' | 'lynch' }
 * Vérifie le cache Supabase (7 jours) puis appelle Gemini 2.5 Flash.
 * Upsert le résultat dans classic_analysis_cache avant de retourner.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ClassicAnalysisResult | ErrorResponse>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API manquante', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  let body: ClassicRequest
  try {
    body = (await request.json()) as ClassicRequest
  } catch {
    return NextResponse.json(
      { error: 'Corps de requête invalide', code: 'INVALID_JSON' },
      { status: 400 },
    )
  }

  const ticker = body.ticker?.trim().toUpperCase()
  const method = body.method

  if (!ticker) {
    return NextResponse.json(
      { error: 'Paramètre manquant : ticker', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  if (!method || !(VALID_METHODS as readonly string[]).includes(method)) {
    return NextResponse.json(
      { error: 'Paramètre invalide : method (buffett | lynch)', code: 'INVALID_PARAM' },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  // Vérification du cache (7 jours)
  const { data: cached } = await supabase
    .from('classic_analysis_cache')
    .select('*')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .eq('method', method)
    .gte('computed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .single()

  if (cached) {
    const meta = (cached.metadata ?? {}) as Record<string, unknown>
    return NextResponse.json(
      {
        ticker,
        method,
        signal: (cached.signal as ClassicAnalysisResult['signal']) ?? 'HOLD',
        score: cached.score ?? 0,
        analysis: cached.analysis ?? '',
        moat: meta.moat as ClassicAnalysisResult['moat'],
        margin_of_safety: typeof meta.margin_of_safety === 'number' ? meta.margin_of_safety : undefined,
        verdict: typeof meta.verdict === 'string' ? meta.verdict : undefined,
        peg: meta.peg !== undefined ? (meta.peg as number | null) : undefined,
        category: typeof meta.category === 'string' ? meta.category : undefined,
        story: meta.story as ClassicAnalysisResult['story'],
        computed_at: cached.computed_at,
        from_cache: true,
      },
      { status: 200 },
    )
  }

  // Sélection du prompt selon la méthode
  const promptTemplate = method === 'buffett' ? PROMPT_BUFFETT : PROMPT_LYNCH
  const systemPrompt = promptTemplate.replace('{ticker}', ticker)

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(
      `Analyse le titre ${ticker} selon la méthode ${method === 'buffett' ? 'Buffett (value investing)' : 'Lynch (growth investing)'} et retourne l'analyse complète en markdown suivie du JSON demandé.`,
    )

    const raw = result.response.text().trim()

    // Extraction du dernier bloc JSON de la réponse
    const matches = [...raw.matchAll(/\{[\s\S]*?\}/g)]
    const jsonMatch = matches[matches.length - 1]
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Format de réponse invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    let parsed: GeminiJson
    try {
      parsed = JSON.parse(jsonMatch[0]) as GeminiJson
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide dans la réponse', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    if (!(VALID_SIGNALS as readonly string[]).includes(parsed.signal) || typeof parsed.score !== 'number') {
      return NextResponse.json(
        { error: 'Structure JSON invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    // Retire le bloc JSON final de l'analyse markdown
    const analysis = raw.slice(0, jsonMatch.index).trimEnd()
    const now = new Date().toISOString()

    // Construction des métadonnées selon la méthode
    const metadata: Record<string, unknown> =
      method === 'buffett'
        ? {
            moat: (parsed as BuffettJson).moat,
            margin_of_safety: (parsed as BuffettJson).margin_of_safety,
            verdict: parsed.verdict,
          }
        : {
            peg: (parsed as LynchJson).peg,
            category: (parsed as LynchJson).category,
            story: (parsed as LynchJson).story,
            verdict: parsed.verdict,
          }

    // Upsert dans classic_analysis_cache
    await supabase
      .from('classic_analysis_cache')
      .upsert(
        {
          user_id: user.id,
          ticker,
          method,
          signal: parsed.signal,
          score: parsed.score,
          analysis,
          metadata,
          computed_at: now,
        },
        { onConflict: 'user_id,ticker,method' },
      )

    const response: ClassicAnalysisResult = {
      ticker,
      method,
      signal: parsed.signal,
      score: parsed.score,
      analysis,
      computed_at: now,
      from_cache: false,
    }

    if (method === 'buffett') {
      const b = parsed as BuffettJson
      response.moat = b.moat
      response.margin_of_safety = b.margin_of_safety
      response.verdict = b.verdict
    } else {
      const l = parsed as LynchJson
      response.peg = l.peg
      response.category = l.category
      response.story = l.story
      response.verdict = l.verdict
    }

    return NextResponse.json(response, { status: 200 })
  } catch (err) {
    if (isQuotaError(err)) {
      return NextResponse.json(
        {
          error: "Plus de tokens disponibles, revenez plus tard.",
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
