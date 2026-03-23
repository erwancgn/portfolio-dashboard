import { NextRequest, NextResponse } from 'next/server'

/** Resultat de recherche retourné par cette route */
export interface SearchResult {
  ticker: string
  name: string
  type: 'stock' | 'etf' | 'crypto'
}

/** Reponse d'erreur standardisee */
interface ErrorResponse {
  error: string
  code: string
}

/** Reponse brute de l'API Yahoo Finance /search */
interface YahooSearchResponse {
  quotes: Array<{
    symbol: string
    longname?: string
    shortname?: string
    quoteType: string
  }>
}

/** Reponse brute de l'API CoinGecko /search */
interface CoinGeckoCoin {
  id: string
  name: string
  symbol: string
}

interface CoinGeckoSearchResponse {
  coins: CoinGeckoCoin[]
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
 * Mappe le champ quoteType Yahoo vers l'enum asset_type du projet.
 */
function mapYahooType(quoteType: string): 'stock' | 'etf' | 'crypto' {
  if (quoteType === 'ETF' || quoteType === 'MUTUALFUND') return 'etf'
  if (quoteType === 'CRYPTOCURRENCY') return 'crypto'
  return 'stock'
}

/**
 * Recherche des actions et ETF via Yahoo Finance.
 * Couvre les marches US et europeens sans cle API.
 * Retourne max 8 resultats.
 */
async function searchStocks(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    quotesCount: '8',
    newsCount: '0',
    enableFuzzyQuery: 'true',
    enableNavLinks: 'false',
  })

  const res = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?${params}`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      cache: 'no-store',
    },
  )

  if (!res.ok) {
    throw new ApiError(`Yahoo Finance indisponible (HTTP ${res.status})`, 'API_ERROR', 503)
  }

  const data = (await res.json()) as YahooSearchResponse

  return (data.quotes ?? [])
    .filter((item) => item.longname ?? item.shortname)
    .slice(0, 8)
    .map((item) => ({
      ticker: item.symbol,
      name: item.longname ?? item.shortname ?? item.symbol,
      type: mapYahooType(item.quoteType),
    }))
}

/**
 * Recherche des cryptomonnaies via l'API CoinGecko.
 * La cle COINGECKO_API_KEY est optionnelle.
 * Retourne max 8 resultats.
 */
async function searchCryptos(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.COINGECKO_API_KEY
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (apiKey) headers['x-cg-demo-api-key'] = apiKey

  const res = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
    { headers, cache: 'no-store' },
  )

  if (res.status === 429) throw new ApiError('Quota CoinGecko depassé', 'RATE_LIMIT', 503)
  if (!res.ok) throw new ApiError(`CoinGecko indisponible (HTTP ${res.status})`, 'API_ERROR', 503)

  const data = (await res.json()) as CoinGeckoSearchResponse

  return (data.coins ?? [])
    .slice(0, 8)
    .map((coin) => ({
      ticker: coin.symbol.toUpperCase(),
      name: coin.name,
      type: 'crypto' as const,
    }))
}

/**
 * GET /api/search
 *
 * Parametres :
 * - q    : terme de recherche (min 2 caracteres)
 * - type : "stock" | "crypto"
 *
 * Retourne : SearchResult[] (max 8 elements)
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<SearchResult[] | ErrorResponse>> {
  const { searchParams } = request.nextUrl
  const query = searchParams.get('q')
  const type = searchParams.get('type')

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: 'Parametre manquant ou trop court : q (min 2 caracteres)', code: 'MISSING_PARAM' },
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
    const results =
      type === 'crypto'
        ? await searchCryptos(query.trim())
        : await searchStocks(query.trim())

    return NextResponse.json(results, { status: 200 })
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
