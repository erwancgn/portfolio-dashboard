import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { fetchFmpFinancialContext } from '@/lib/fmp-financials'
import { extractLastJsonObject, sanitizeModelAnalysis } from '@/lib/ai'
import { isSafeTicker, validateClassicAnalysisJson } from '@/lib/ai-validation'
import { loadAgent, resolveModelId } from '@/lib/agent-loader'
import {
  type ClassicAnalysisResult,
  type GeminiJson,
  buildCacheResponse,
  buildMetadata,
  buildFreshResponse,
  isQuotaError,
} from '@/lib/analyse-classic'

/** Corps de la requête attendu */
interface ClassicRequest {
  ticker: string
  method: 'buffett' | 'lynch'
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

export type { ClassicAnalysisResult }
const VALID_SIGNALS = ['BUY', 'HOLD', 'SELL'] as const
const VALID_METHODS = ['buffett', 'lynch'] as const
/** Agents chargés une seule fois au démarrage du module */
const AGENT_BUFFETT = loadAgent('buffett-analyse')
const AGENT_LYNCH = loadAgent('lynch-analyse')

/**
 * POST /api/analyse/classic
 *
 * Corps : { ticker: string, method: 'buffett' | 'lynch' }
 * Vérifie le cache Supabase (7 jours) puis appelle Gemini via l'agent sélectionné.
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
  if (!isSafeTicker(ticker)) {
    return NextResponse.json(
      { error: 'Ticker invalide', code: 'INVALID_PARAM' },
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
    return NextResponse.json(
      buildCacheResponse(ticker, method, cached as Record<string, unknown>),
      { status: 200 },
    )
  }

  // Récupération des données financières réelles avant l'appel Gemini
  const financialData = await fetchFmpFinancialContext(ticker)

  // Sélection de l'agent selon la méthode
  const agent = method === 'buffett' ? AGENT_BUFFETT : AGENT_LYNCH
  const systemPrompt = agent.prompt
    .replace('{ticker}', ticker)
    .replace('{financial_data}', financialData || '> ⚠️ Données FMP non disponibles — base-toi sur tes connaissances les plus récentes.')

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: resolveModelId(agent.meta.model),
      systemInstruction: systemPrompt,
    })

    const result = await model.generateContent(
      `Analyse le titre ${ticker} selon la méthode ${method === 'buffett' ? 'Buffett (value investing)' : 'Lynch (growth investing)'}. Les données financières réelles sont déjà injectées dans le contexte système — utilise-les comme source principale. Retourne l'analyse complète en markdown suivie du JSON demandé.`,
    )

    const raw = result.response.text().trim()
    const jsonBlock = extractLastJsonObject(raw)
    if (!jsonBlock) {
      return NextResponse.json(
        { error: 'Format de réponse invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    let parsed: GeminiJson
    try {
      parsed = JSON.parse(jsonBlock) as GeminiJson
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide dans la réponse', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    const validated = validateClassicAnalysisJson(method, parsed)
    if (!validated || !(VALID_SIGNALS as readonly string[]).includes(validated.signal)) {
      return NextResponse.json(
        { error: 'Structure JSON invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    const analysis = sanitizeModelAnalysis(
      raw.slice(0, raw.lastIndexOf(jsonBlock)).trimEnd(),
    )
    if (!analysis) {
      return NextResponse.json(
        { error: 'Analyse vide retournée par le modèle', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    const now = new Date().toISOString()

    await supabase
      .from('classic_analysis_cache')
      .upsert(
        {
          user_id: user.id,
          ticker,
          method,
          signal: validated.signal,
          score: validated.score,
          analysis,
          metadata: buildMetadata(method, validated as GeminiJson),
          computed_at: now,
        },
        { onConflict: 'user_id,ticker,method' },
      )

    return NextResponse.json(buildFreshResponse(ticker, method, validated as GeminiJson, analysis, now), { status: 200 })
  } catch (err) {
    if (isQuotaError(err)) {
      return NextResponse.json(
        { error: "Plus de tokens disponibles, revenez plus tard.", code: 'QUOTA_EXCEEDED' },
        { status: 429 },
      )
    }

    return NextResponse.json(
      { error: "Erreur lors de l'appel à Gemini", code: 'AI_ERROR' },
      { status: 503 },
    )
  }
}
