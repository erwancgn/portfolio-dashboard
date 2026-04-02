/**
 * Fonctions d'acces a l'API Financial Modeling Prep (FMP).
 * Cle API lue via process.env.FMP_API_KEY — jamais exposee cote client.
 */
import { readThroughTtlCache } from '@/lib/cache'

const FMP_PROFILE_TTL_MS = 60 * 60 * 1000

/** Profil retourne par FMP /profile */
export interface FmpProfile {
  name: string | undefined
  sector: string | undefined
  industry: string | undefined
  description: string | undefined
  country: string | undefined
  logoUrl: string | undefined
  isin: string | undefined
}

/** Resultat retourne par FMP /search */
export interface FmpSearchResult {
  ticker: string
  name: string
  type: string
}

/** Reponse brute d'un item /stable/profile FMP */
interface FmpProfileRaw {
  symbol?: string
  companyName?: string
  sector?: string
  industry?: string
  description?: string
  country?: string
  image?: string
  isin?: string
  isEtf?: boolean
  isFund?: boolean
}

/** Reponse brute d'un item /stable/search-name FMP */
interface FmpSearchRaw {
  symbol?: string
  name?: string
  exchangeFullName?: string
  exchange?: string
}

/**
 * Recupere le profil enrichi d'un actif via FMP /profile.
 * Retourne : sector, industry, description, country, logoUrl, isin.
 * Retourne null en cas d'erreur ou si l'actif est inconnu.
 *
 * @param ticker - Symbole boursier (ex: AAPL, MC.PA)
 */
export async function fetchFmpProfile(ticker: string): Promise<FmpProfile | null> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    console.error('[fmp] FMP_API_KEY manquante')
    return null
  }

  return readThroughTtlCache(`fmp:profile:${ticker}`, FMP_PROFILE_TTL_MS, async () => {
    try {
      const url = `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) return null

      const data = (await res.json()) as FmpProfileRaw[]
      if (!Array.isArray(data) || data.length === 0) return null

      const item = data[0]
      return {
        name: item.companyName || undefined,
        sector: item.sector || undefined,
        industry: item.industry || undefined,
        description: item.description || undefined,
        country: item.country || undefined,
        logoUrl: item.image || undefined,
        isin: item.isin || undefined,
      }
    } catch (err) {
      console.error('[fmp] fetchFmpProfile error:', err)
      return null
    }
  })
}

/**
 * Recherche des actifs via FMP /search.
 * Retourne un tableau de { ticker, name, type } ou [] en cas d'erreur.
 *
 * @param query - Terme de recherche (ex: "Apple", "MSFT")
 */
export async function fetchFmpSearch(query: string): Promise<FmpSearchResult[]> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    console.error('[fmp] FMP_API_KEY manquante')
    return []
  }

  try {
    const url = `https://financialmodelingprep.com/stable/search-name?query=${encodeURIComponent(query)}&limit=8&apikey=${apiKey}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []

    const data = (await res.json()) as FmpSearchRaw[]
    if (!Array.isArray(data)) return []

    return data
      .filter((item): item is FmpSearchRaw & { symbol: string; name: string } =>
        typeof item.symbol === 'string' && typeof item.name === 'string',
      )
      .map((item) => ({
        ticker: item.symbol,
        name: item.name,
        type: item.exchange ?? item.exchangeFullName ?? '',
      }))
  } catch (err) {
    console.error('[fmp] fetchFmpSearch error:', err)
    return []
  }
}
