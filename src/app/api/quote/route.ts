import { NextRequest, NextResponse } from 'next/server'

/** Reponse retournee par cette route */
export interface QuoteResponse {
  ticker: string
  price: number
  currency: string
  updatedAt: string
}

/** Reponse d'erreur standardisee */
interface ErrorResponse {
  error: string
  code: string
}

/** Reponse brute de l'API Finnhub /quote */
interface FinnhubQuote {
  c: number   // prix actuel (current)
  d: number   // variation du jour
  dp: number  // variation % du jour
  h: number   // haut du jour
  l: number   // bas du jour
  o: number   // ouverture
  pc: number  // cloture precedente
  t: number   // timestamp
}

/** Reponse brute de l'API CoinGecko /simple/price */
type CoinGeckoPrice = Record<string, { usd: number }>

/**
 * Recupere le prix d'une action via l'API Finnhub.
 * Utilise la variable d'environnement serveur FINNHUB_API_KEY.
 */
async function fetchStockPrice(ticker: string): Promise<QuoteResponse> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    throw new ApiError('Configuration serveur manquante : FINNHUB_API_KEY absent', 'CONFIG_ERROR', 503)
  }

  const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`
  const res = await fetch(url, { cache: 'no-store' })

  if (res.status === 429) {
    throw new ApiError('Quota Finnhub depassé — reessayer plus tard', 'RATE_LIMIT', 503)
  }
  if (!res.ok) {
    throw new ApiError(`Finnhub indisponible (HTTP ${res.status})`, 'API_ERROR', 503)
  }

  const data = (await res.json()) as FinnhubQuote

  // Finnhub retourne c=0 quand le ticker n'existe pas
  if (!data.c || data.c === 0) {
    throw new ApiError(`Ticker inconnu : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }

  return {
    ticker: ticker.toUpperCase(),
    price: data.c,
    currency: 'USD',
    updatedAt: new Date(data.t * 1000).toISOString(),
  }
}

/**
 * Recupere le prix d'une crypto via l'API CoinGecko.
 * La cle COINGECKO_API_KEY est optionnelle (plan gratuit disponible sans cle).
 */
async function fetchCryptoPrice(ticker: string): Promise<QuoteResponse> {
  const coinId = ticker.toLowerCase()
  const apiKey = process.env.COINGECKO_API_KEY

  const baseUrl = 'https://api.coingecko.com/api/v3/simple/price'
  const params = new URLSearchParams({ ids: coinId, vs_currencies: 'usd' })
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (apiKey) {
    headers['x-cg-demo-api-key'] = apiKey
  }

  const res = await fetch(`${baseUrl}?${params.toString()}`, {
    headers,
    cache: 'no-store',
  })

  if (res.status === 429) {
    throw new ApiError('Quota CoinGecko depassé — reessayer plus tard', 'RATE_LIMIT', 503)
  }
  if (!res.ok) {
    throw new ApiError(`CoinGecko indisponible (HTTP ${res.status})`, 'API_ERROR', 503)
  }

  const data = (await res.json()) as CoinGeckoPrice

  if (!data[coinId] || data[coinId].usd === undefined) {
    throw new ApiError(`Crypto inconnue : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }

  return {
    ticker: ticker.toUpperCase(),
    price: data[coinId].usd,
    currency: 'USD',
    updatedAt: new Date().toISOString(),
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
 * GET /api/quote
 *
 * Paramètres :
 * - ticker : symbole de l'actif (ex: AAPL, BTC)
 * - type   : "stock" | "crypto"
 *
 * Retourne : { ticker, price, currency, updatedAt }
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

    // Erreur reseau inattendue
    return NextResponse.json(
      { error: 'Erreur serveur inattendue', code: 'INTERNAL_ERROR' },
      { status: 503 },
    )
  }
}
