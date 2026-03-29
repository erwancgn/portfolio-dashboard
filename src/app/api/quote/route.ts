import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchYahooChart, YahooApiError } from '@/lib/yahoo'
import { fetchFmpProfile } from '@/lib/fmp'

/** Reponse retournee par cette route */
export interface QuoteResponse {
  ticker: string
  name: string
  price: number
  currency: string
  isin?: string
  sector?: string
  industry?: string
  description?: string
  country?: string
  logoUrl?: string
  updatedAt: string
}

/** Reponse d'erreur standardisee */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * Recupere le prix et les metadonnees d'un actif.
 * Cascade : DB cache → Yahoo /chart → FMP /profile.
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
  const meta = await fetchYahooChart(ticker)
  const isin = cachedIsin ?? meta.isin

  // 3. FMP /profile — secteur, industry, description, country, logoUrl
  const fmp = await fetchFmpProfile(ticker)
  const sector = cachedSector ?? fmp?.sector

  return {
    ticker: ticker.toUpperCase(),
    name: meta.longName ?? meta.shortName ?? ticker.toUpperCase(),
    price: meta.regularMarketPrice,
    currency: meta.currency,
    ...(isin ? { isin } : {}),
    ...(sector ? { sector } : {}),
    ...(fmp?.industry ? { industry: fmp.industry } : {}),
    ...(fmp?.description ? { description: fmp.description } : {}),
    ...(fmp?.country ? { country: fmp.country } : {}),
    ...(fmp?.logoUrl ? { logoUrl: fmp.logoUrl } : {}),
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
    if (err instanceof YahooApiError) {
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
