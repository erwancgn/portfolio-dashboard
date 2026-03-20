import { NextRequest, NextResponse } from 'next/server'

/** Reponse retournee par cette route */
export interface ExchangeRateResponse {
  from: string
  to: string
  rate: number
  date: string
}

/** Reponse d'erreur standardisee */
interface ErrorResponse {
  error: string
  code: string
}

/** Reponse brute de l'API Frankfurter */
interface FrankfurterResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
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
 * Recupere un taux de change via l'API Frankfurter (gratuite, sans cle).
 * Documentation : https://www.frankfurter.app/docs/
 */
async function fetchExchangeRate(from: string, to: string): Promise<ExchangeRateResponse> {
  if (from.toUpperCase() === to.toUpperCase()) {
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: 1,
      date: new Date().toISOString().split('T')[0],
    }
  }

  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  const res = await fetch(url, { cache: 'no-store' })

  if (res.status === 404) {
    throw new ApiError(
      `Devise inconnue : ${from} ou ${to}`,
      'CURRENCY_NOT_FOUND',
      404,
    )
  }
  if (!res.ok) {
    throw new ApiError(
      `Frankfurter indisponible (HTTP ${res.status})`,
      'API_ERROR',
      503,
    )
  }

  const data = (await res.json()) as FrankfurterResponse
  const toUpper = to.toUpperCase()
  const rate = data.rates[toUpper]

  if (rate === undefined) {
    throw new ApiError(
      `Devise cible inconnue : ${to}`,
      'CURRENCY_NOT_FOUND',
      404,
    )
  }

  return {
    from: data.base,
    to: toUpper,
    rate,
    date: data.date,
  }
}

/**
 * GET /api/exchange-rate
 *
 * Paramètres :
 * - from : devise source (ex: USD)
 * - to   : devise cible (ex: EUR)
 *
 * Retourne : { from, to, rate, date }
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ExchangeRateResponse | ErrorResponse>> {
  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  if (!from || from.trim() === '') {
    return NextResponse.json(
      { error: 'Parametre manquant : from', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  if (!to || to.trim() === '') {
    return NextResponse.json(
      { error: 'Parametre manquant : to', code: 'MISSING_PARAM' },
      { status: 400 },
    )
  }

  try {
    const result = await fetchExchangeRate(from.trim(), to.trim())
    return NextResponse.json(result, { status: 200 })
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
