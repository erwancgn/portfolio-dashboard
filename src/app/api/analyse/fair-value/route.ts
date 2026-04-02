import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { extractLastJsonObject } from '@/lib/ai'
import { isSafeTicker, validateFairValueJson } from '@/lib/ai-validation'

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

function buildQuoteFallback(
  ticker: string,
  currentPriceEur: number,
): Omit<FairValueResponse, 'computed_at' | 'from_cache'> {
  return {
    ticker,
    fair_value: null,
    current_price: Number(currentPriceEur.toFixed(2)),
    signal: 'fair',
    upside_percent: 0,
    analysis:
      "Le modèle n'a pas pu produire une fair value fiable pour cet actif. Le prix de marché actuel a néanmoins été récupéré automatiquement pour conserver un repère exploitable.",
    methodology: 'Prix de marché',
    confidence: 'low',
  }
}

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
  if (!isSafeTicker(ticker)) {
    return NextResponse.json(
      { error: 'Ticker invalide', code: 'INVALID_PARAM' },
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
  const prompt = `Tu es un analyste financier senior. Estime la fair value de ${ticker}.
Utilise des données récentes: prix actuel, multiples adaptés au type d'actif, consensus analystes et fondamentaux récents.
Pour un ETF, appuie-toi sur NAV, composition et comparaison avec des ETF proches.
Retourne fair_value et current_price dans la devise native de l'actif et indique cette devise dans "currency".
Le champ "analysis" doit être un court paragraphe en français, 2 phrases max, mentionnant la devise d'origine si elle n'est pas en EUR.
Réponds UNIQUEMENT avec ce JSON valide :
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
    const liveQuotePromise = fetchQuote(ticker)
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ googleSearch: {} } as any],
    })

    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonBlock = extractLastJsonObject(raw)
    const liveQuote = await liveQuotePromise

    async function getQuoteFallbackResponse():
      Promise<NextResponse<FairValueResponse | ErrorResponse> | null> {
      if (!liveQuote) return null

      const usdEur = await fetchRate('USD', 'EUR')
      const needsGbp = liveQuote.currency === 'GBP' || liveQuote.currency === 'GBp'
      const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1
      const fallbackPrice = toEur(liveQuote.price, liveQuote.currency, usdEur, gbpEur)

      if (fallbackPrice == null) return null

      const fallback = buildQuoteFallback(ticker, fallbackPrice)
      return NextResponse.json(
        {
          ...fallback,
          computed_at: new Date().toISOString(),
          from_cache: false,
        },
        { status: 200 },
      )
    }

    async function resolveLivePriceEur(): Promise<number | null> {
      if (!liveQuote) return null

      const usdEur = await fetchRate('USD', 'EUR')
      const needsGbp = liveQuote.currency === 'GBP' || liveQuote.currency === 'GBp'
      const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1
      return toEur(liveQuote.price, liveQuote.currency, usdEur, gbpEur)
    }

    if (!jsonBlock) {
      const fallbackResponse = await getQuoteFallbackResponse()
      if (fallbackResponse) return fallbackResponse

      return NextResponse.json(
        { error: 'Format de réponse invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    let parsed: GeminiJsonResponse
    try {
      parsed = JSON.parse(jsonBlock) as GeminiJsonResponse
    } catch {
      const fallbackResponse = await getQuoteFallbackResponse()
      if (fallbackResponse) return fallbackResponse

      return NextResponse.json(
        { error: 'JSON invalide dans la réponse', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    const validated = validateFairValueJson(parsed)
    if (
      !validated ||
      !VALID_SIGNALS.includes(validated.signal) ||
      !VALID_CONFIDENCE.includes(validated.confidence)
    ) {
      const fallbackResponse = await getQuoteFallbackResponse()
      if (fallbackResponse) return fallbackResponse

      return NextResponse.json(
        { error: 'Structure JSON invalide', code: 'PARSE_ERROR' },
        { status: 503 },
      )
    }

    // Conversion vers EUR si la devise retournée n'est pas EUR
    const originalCurrency = validated.currency ?? 'EUR'
    const normCurrency = originalCurrency.toUpperCase()
    // GBp = pence sterling (Yahoo Finance) → diviser par 100 avant conversion GBP→EUR
    const isGBpence = originalCurrency === 'GBp'
    const lookupCurrency = isGBpence ? 'GBP' : normCurrency
    let currentPriceEur = validated.current_price
    let fairValueEur = validated.fair_value

    if (normCurrency !== 'EUR') {
      let rate = await fetchRate(lookupCurrency, 'EUR')
      // Si Frankfurter a échoué (rate = 1) et devise est USD, on applique le repli
      if (rate === 1 && lookupCurrency === 'USD') {
        rate = 1 / FALLBACK_EUR_USD_RATE
      }
      const divisor = isGBpence ? 100 : 1
      currentPriceEur = (validated.current_price / divisor) * rate
      fairValueEur = validated.fair_value != null ? (validated.fair_value / divisor) * rate : null
    }

    const liveCurrentPriceEur = await resolveLivePriceEur()
    if (liveCurrentPriceEur != null) {
      currentPriceEur = liveCurrentPriceEur
      if (fairValueEur != null && currentPriceEur > 0) {
        validated.upside_percent = Number(
          (((fairValueEur - currentPriceEur) / currentPriceEur) * 100).toFixed(2),
        )
      }
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
          signal: validated.signal,
          analysis: validated.analysis,
          sources: {
            current_price: currentPriceEur,
            upside_percent: validated.upside_percent,
            methodology: validated.methodology,
            confidence: validated.confidence,
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
        signal: validated.signal,
        upside_percent: validated.upside_percent,
        analysis: validated.analysis,
        methodology: validated.methodology,
        confidence: validated.confidence,
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
