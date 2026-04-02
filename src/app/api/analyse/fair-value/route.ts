import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { fetchRate } from '@/lib/quote'

/** Taux de repli EUR/USD si Frankfurter est indisponible */
const FALLBACK_EUR_USD_RATE = 1.1

/** Corps de la requête attendu */
interface FairValueRequest {
  ticker: string
}

/** Réponse retournée par cette route */
export interface FairValueResponse {
  ticker: string
  fair_value: number | null
  current_price: number
  signal: 'undervalued' | 'fair' | 'overvalued'
  upside_percent: number
  analysis: string
  methodology: string
  confidence: 'low' | 'medium' | 'high'
  computed_at: string
  from_cache: boolean
}

/** Réponse d'erreur standardisée */
interface ErrorResponse {
  error: string
  code: string
}

/** Structure JSON attendue de Gemini */
interface GeminiJsonResponse {
  fair_value: number | null
  current_price: number
  currency: string
  signal: 'undervalued' | 'fair' | 'overvalued'
  upside_percent: number
  analysis: string
  methodology: string
  confidence: 'low' | 'medium' | 'high'
}

const VALID_SIGNALS = ['undervalued', 'fair', 'overvalued'] as const
const VALID_CONFIDENCE = ['low', 'medium', 'high'] as const

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
 * POST /api/analyse/fair-value
 *
 * Corps : { ticker: string }
 * Vérifie le cache Supabase (24h) puis appelle Gemini 2.5 Flash-Lite
 * avec Search Grounding pour estimer la fair value d'un actif.
 * Upsert le résultat dans fair_value_cache avant de retourner.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<FairValueResponse | ErrorResponse>> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Clé API manquante', code: 'CONFIG_ERROR' },
      { status: 500 },
    )
  }

  let body: FairValueRequest
  try {
    body = (await request.json()) as FairValueRequest
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  // Vérification du cache (24h)
  const { data: cached } = await supabase
    .from('fair_value_cache')
    .select('*')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .gte('computed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .single()

  const cachedSources = (cached?.sources ?? {}) as {
    current_price?: number
    upside_percent?: number
    methodology?: string
    confidence?: string
  }
  // Invalide les entrées sans current_price (ancien format avant fix)
  if (cached && cachedSources.current_price != null) {
    const extra = cachedSources
    return NextResponse.json(
      {
        ticker,
        fair_value: cached.fair_value != null ? Number(cached.fair_value) : null,
        current_price: extra.current_price ?? 0,
        signal: (cached.signal as FairValueResponse['signal']) ?? 'fair',
        upside_percent: extra.upside_percent ?? 0,
        analysis: cached.analysis ?? '',
        methodology: extra.methodology ?? '',
        confidence: (extra.confidence as FairValueResponse['confidence']) ?? 'medium',
        computed_at: cached.computed_at,
        from_cache: true,
      },
      { status: 200 },
    )
  }

  // Appel Gemini avec Search Grounding
  const prompt = `Tu es un analyste financier senior. Estime la fair value de l'actif ${ticker}.

Recherche :
1. Le prix actuel du marché (dans sa devise native)
2. Les métriques de valorisation clés (P/E, P/B, EV/EBITDA selon le type d'actif)
3. Le consensus des analystes (prix cible moyen)
4. Les données fondamentales récentes (croissance revenus, marges, dette)

Pour les ETF : utilise la valeur liquidative, la composition sectorielle, et compare aux ETF similaires.

IMPORTANT : Retourne current_price et fair_value dans la devise NATIVE de l'actif (USD pour les actions US, EUR pour les actions européennes, GBP pour les actions UK, etc.). Indique cette devise dans le champ "currency".

Dans le champ "analysis", mentionne le prix original en devise locale si différent d'EUR (ex: "Prix cible : 145 € (160 USD)").

Réponds UNIQUEMENT en JSON valide, sans markdown, sans blocs de code :
{
  "fair_value": <number ou null si ETF non applicable>,
  "current_price": <number, dans la devise native>,
  "currency": "<devise ISO 4217, ex: USD, EUR, GBP>",
  "signal": "undervalued" | "fair" | "overvalued",
  "upside_percent": <number>,
  "analysis": "<paragraphe narratif 2-3 phrases en français>",
  "methodology": "<DCF / Comparables / Consensus analystes / NAV>",
  "confidence": "low" | "medium" | "high"
}`

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()

    // Extraction du bloc JSON (peut être enveloppé dans ```json...```)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Format de réponse invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    let parsed: GeminiJsonResponse
    try {
      parsed = JSON.parse(jsonMatch[0]) as GeminiJsonResponse
    } catch {
      return NextResponse.json(
        { error: 'JSON invalide dans la réponse', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    if (
      !VALID_SIGNALS.includes(parsed.signal) ||
      !VALID_CONFIDENCE.includes(parsed.confidence) ||
      typeof parsed.current_price !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Structure JSON invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    // Conversion vers EUR si la devise retournée n'est pas EUR
    const originalCurrency = parsed.currency ?? 'EUR'
    const normCurrency = originalCurrency.toUpperCase()
    // GBp = pence sterling (Yahoo Finance) → diviser par 100 avant conversion GBP→EUR
    const isGBpence = originalCurrency === 'GBp'
    const lookupCurrency = isGBpence ? 'GBP' : normCurrency
    let currentPriceEur = parsed.current_price
    let fairValueEur = parsed.fair_value

    if (normCurrency !== 'EUR') {
      let rate = await fetchRate(lookupCurrency, 'EUR')
      // Si Frankfurter a échoué (rate = 1) et devise est USD, on applique le repli
      if (rate === 1 && lookupCurrency === 'USD') {
        rate = 1 / FALLBACK_EUR_USD_RATE
      }
      const divisor = isGBpence ? 100 : 1
      currentPriceEur = (parsed.current_price / divisor) * rate
      fairValueEur = parsed.fair_value != null ? (parsed.fair_value / divisor) * rate : null
    }

    const now = new Date().toISOString()

    // Upsert dans fair_value_cache — prix stockés en EUR
    await supabase
      .from('fair_value_cache')
      .upsert(
        {
          user_id: user.id,
          ticker,
          fair_value: fairValueEur,
          signal: parsed.signal,
          analysis: parsed.analysis,
          sources: {
            current_price: currentPriceEur,
            upside_percent: parsed.upside_percent,
            methodology: parsed.methodology,
            confidence: parsed.confidence,
          },
          computed_at: now,
        },
        { onConflict: 'user_id,ticker' },
      )

    return NextResponse.json(
      {
        ticker,
        fair_value: fairValueEur,
        current_price: currentPriceEur,
        signal: parsed.signal,
        upside_percent: parsed.upside_percent,
        analysis: parsed.analysis,
        methodology: parsed.methodology,
        confidence: parsed.confidence,
        computed_at: now,
        from_cache: false,
      },
      { status: 200 },
    )
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
