import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Reponse retournee par cette route */
export interface QuoteResponse {
  ticker: string
  name: string
  price: number
  currency: string
  isin?: string
  sector?: string
  updatedAt: string
}

/** Reponse d'erreur standardisee */
interface ErrorResponse {
  error: string
  code: string
}

/** Reponse brute de l'API Yahoo Finance /chart */
interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        currency: string
        longName?: string
        shortName?: string
        symbol: string
        isin?: string
      }
    }> | null
    error: { code: string; description: string } | null
  }
}

/** Reponse brute de l'API Yahoo Finance /quoteSummary */
interface YahooSummaryResponse {
  quoteSummary: {
    result: Array<{
      summaryProfile?: { sector?: string }
      topHoldings?: {
        sectorWeightings?: Array<Record<string, number>>
      }
    }> | null
    error: unknown
  }
}

/** Erreur metier avec code HTTP et code machine */
class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Normalise les cles sectorWeightings (ETF) vers le format summaryProfile */
const SECTOR_LABELS: Record<string, string> = {
  'technology': 'Technology',
  'financial-services': 'Financial Services',
  'healthcare': 'Healthcare',
  'consumer-cyclical': 'Consumer Cyclical',
  'communication-services': 'Communication Services',
  'industrials': 'Industrials',
  'consumer-defensive': 'Consumer Defensive',
  'energy': 'Energy',
  'utilities': 'Utilities',
  'real-estate': 'Real Estate',
  'basic-materials': 'Basic Materials',
}

/**
 * Extrait le secteur dominant d'un tableau sectorWeightings Yahoo (ETF).
 * Chaque entree est un objet { "technology": 0.32 }.
 */
function extractTopSector(weightings: Array<Record<string, number>>): string | undefined {
  let topKey = ''
  let topWeight = 0
  for (const entry of weightings) {
    for (const [key, val] of Object.entries(entry)) {
      if (val > topWeight) {
        topWeight = val
        topKey = key
      }
    }
  }
  return topKey ? (SECTOR_LABELS[topKey] ?? topKey) : undefined
}

/**
 * Recupere le prix d'un actif via Yahoo Finance.
 * Enrichit avec isin/secteur depuis la DB (cache) puis depuis Yahoo.
 * Couvre actions, ETF et crypto sans cle API.
 */
async function fetchPrice(ticker: string): Promise<QuoteResponse> {
  // 1. Lookup DB — isin + secteur deja connus pour ce ticker
  let cachedIsin: string | undefined
  let cachedSector: string | undefined
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('positions')
        .select('isin, sector')
        .eq('user_id', user.id)
        .eq('ticker', ticker.toUpperCase())
        .not('isin', 'is', null)
        .limit(1)
        .maybeSingle()
      if (data?.isin) cachedIsin = data.isin
      if (data?.sector) cachedSector = data.sector
    }
  } catch {
    // Lookup DB optionnel — echec silencieux
  }

  // 2. Yahoo /chart — prix + nom + isin (si dispo)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    cache: 'no-store',
  })

  if (res.status === 404) {
    throw new ApiError(`Ticker inconnu : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }
  if (!res.ok) {
    throw new ApiError(`Yahoo Finance indisponible (HTTP ${res.status})`, 'API_ERROR', 503)
  }

  const data = (await res.json()) as YahooChartResponse

  if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
    throw new ApiError(`Ticker inconnu : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }

  const meta = data.chart.result[0].meta
  const isin = cachedIsin ?? meta.isin

  // 3. Yahoo /quoteSummary — secteur si absent du cache DB
  // Stocks : summaryProfile.sector / ETF : topHoldings.sectorWeightings
  let sector = cachedSector
  if (!sector) {
    try {
      const summaryUrl = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryProfile%2CtopHoldings`
      const summaryRes = await fetch(summaryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        cache: 'no-store',
      })
      if (summaryRes.ok) {
        const summaryData = (await summaryRes.json()) as YahooSummaryResponse
        const result = summaryData.quoteSummary.result?.[0]
        sector = result?.summaryProfile?.sector
        if (!sector) {
          const weightings = result?.topHoldings?.sectorWeightings
          if (weightings && weightings.length > 0) {
            sector = extractTopSector(weightings)
          }
        }
      }
    } catch {
      // Secteur optionnel — echec silencieux
    }
  }

  return {
    ticker: ticker.toUpperCase(),
    name: meta.longName ?? meta.shortName ?? ticker.toUpperCase(),
    price: meta.regularMarketPrice,
    currency: meta.currency,
    ...(isin ? { isin } : {}),
    ...(sector ? { sector } : {}),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * GET /api/quote
 *
 * Parametres :
 * - ticker : symbole de l'actif (ex: AAPL, MC.PA, BTC-EUR, ETH-USD)
 *
 * Retourne : { ticker, name, price, currency, isin?, sector?, updatedAt }
 */
export async function GET(request: NextRequest): Promise<NextResponse<QuoteResponse | ErrorResponse>> {
  const { searchParams } = request.nextUrl
  const ticker = searchParams.get('ticker')

  if (!ticker || ticker.trim() === '') {
    return NextResponse.json(
      { error: 'Parametre manquant : ticker', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  try {
    const quote = await fetchPrice(ticker.trim())
    return NextResponse.json(quote, { status: 200 })
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.httpStatus },
      )
    }
    return NextResponse.json(
      { error: 'Erreur serveur inattendue', code: 'INTERNAL_ERROR' },
      { status: 503 },
    )
  }
}
