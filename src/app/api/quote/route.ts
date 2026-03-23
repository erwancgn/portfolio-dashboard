import { NextRequest, NextResponse } from 'next/server'

/** Reponse retournee par cette route */
export interface QuoteResponse {
  ticker: string
  name: string
  price: number
  currency: string
  isin?: string
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

/**
 * Recupere le prix d'un actif via Yahoo Finance.
 * Couvre actions, ETF et crypto (ex: BTC-EUR, ETH-USD) sans cle API.
 * Marches US et europeens (.PA, .MI, .L…) supportes.
 */
async function fetchPrice(ticker: string): Promise<QuoteResponse> {
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

  return {
    ticker: ticker.toUpperCase(),
    name: meta.longName ?? meta.shortName ?? ticker.toUpperCase(),
    price: meta.regularMarketPrice,
    currency: meta.currency,
    ...(meta.isin ? { isin: meta.isin } : {}),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * GET /api/quote
 *
 * Parametres :
 * - ticker : symbole de l'actif (ex: AAPL, MC.PA, BTC-EUR, ETH-USD)
 * - type   : "stock" | "crypto" (conserve pour compatibilite, non utilise)
 *
 * Retourne : { ticker, name, price, currency, updatedAt }
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
