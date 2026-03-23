import { NextRequest, NextResponse } from 'next/server'

/** Reponse retournee par cette route */
export interface QuoteResponse {
  ticker: string
  name: string
  price: number
  currency: string
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
      }
    }> | null
    error: { code: string; description: string } | null
  }
}

/** Reponse brute de l'API CoinGecko /simple/price */
type CoinGeckoPrice = Record<string, { usd: number }>

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
 * Recupere le prix d'une action ou ETF via Yahoo Finance.
 * Couvre les marches US et europeens (.PA, .MI, .L…) sans cle API.
 */
async function fetchStockPrice(ticker: string): Promise<QuoteResponse> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
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
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Recupere le prix d'une crypto via l'API CoinGecko.
 * La cle COINGECKO_API_KEY est optionnelle (plan gratuit disponible sans cle).
 */
async function fetchCryptoPrice(ticker: string): Promise<QuoteResponse> {
  const coinId = ticker.toLowerCase()
  const apiKey = process.env.COINGECKO_API_KEY
  const params = new URLSearchParams({ ids: coinId, vs_currencies: 'usd' })
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?${params}`, {
    headers,
    cache: 'no-store',
  })

  if (res.status === 429) throw new ApiError('Quota CoinGecko depassé — reessayer plus tard', 'RATE_LIMIT', 503)
  if (!res.ok) throw new ApiError(`CoinGecko indisponible (HTTP ${res.status})`, 'API_ERROR', 503)

  const data = (await res.json()) as CoinGeckoPrice

  if (!data[coinId] || data[coinId].usd === undefined) {
    throw new ApiError(`Crypto inconnue : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }

  return {
    ticker: ticker.toUpperCase(),
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    price: data[coinId].usd,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
  }
}

/**
 * GET /api/quote
 *
 * Parametres :
 * - ticker : symbole de l'actif (ex: AAPL, MC.PA, BTC)
 * - type   : "stock" | "crypto"
 *
 * Retourne : { ticker, name, price, currency, updatedAt }
 */
export async function GET(request: NextRequest): Promise<NextResponse<QuoteResponse | ErrorResponse>> {
  const { searchParams } = request.nextUrl
  const ticker = searchParams.get('ticker')
  const type = searchParams.get('type')

  if (!ticker || ticker.trim() === '') {
    return NextResponse.json(
      { error: 'Parametre manquant : ticker', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  if (type !== 'stock' && type !== 'crypto') {
    return NextResponse.json(
      { error: 'Parametre invalide : type doit etre "stock" ou "crypto"', code: 'INVALID_PARAM' },
      { status: 400 },
    )
  }

  try {
    const quote =
      type === 'stock'
        ? await fetchStockPrice(ticker.trim())
        : await fetchCryptoPrice(ticker.trim())

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
