/**
 * Fonctions d'acces a l'API Yahoo Finance (non officielle, sans cle).
 * Couvre actions, ETF et crypto — marches US et europeens.
 */

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

/** Donnees extraites du meta Yahoo /chart */
export interface YahooChartMeta {
  regularMarketPrice: number
  currency: string
  longName?: string
  shortName?: string
  isin?: string
}

/** Erreur metier avec code HTTP et code machine */
export class YahooApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message)
    this.name = 'YahooApiError'
  }
}

/** Mapping cles sectorWeightings ETF vers libelle normalisé */
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

const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }

/**
 * Recupere les metadonnees d'un actif via Yahoo Finance /chart.
 * Retourne : prix, devise, nom, isin (si disponible).
 * Leve YahooApiError si le ticker est inconnu ou l'API indisponible.
 */
export async function fetchYahooChart(ticker: string): Promise<YahooChartMeta> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
  const res = await fetch(url, { headers: YAHOO_HEADERS, cache: 'no-store' })

  if (res.status === 404) {
    throw new YahooApiError(`Ticker inconnu : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }
  if (!res.ok) {
    throw new YahooApiError(`Yahoo Finance indisponible (HTTP ${res.status})`, 'API_ERROR', 503)
  }

  const data = (await res.json()) as YahooChartResponse
  if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
    throw new YahooApiError(`Ticker inconnu : ${ticker}`, 'TICKER_NOT_FOUND', 404)
  }

  return data.chart.result[0].meta
}

/**
 * Recupere le secteur d'un actif via Yahoo Finance /quoteSummary.
 * Actions : summaryProfile.sector / ETF : top de topHoldings.sectorWeightings.
 * Retourne undefined en cas d'echec (echec silencieux — secteur optionnel).
 *
 * @deprecated Remplacee par fetchFmpProfile — Yahoo quoteSummary exige un crumb depuis S12.
 */
export async function fetchYahooSector(ticker: string): Promise<string | undefined> {
  try {
    const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=summaryProfile%2CtopHoldings`
    const res = await fetch(url, { headers: YAHOO_HEADERS, cache: 'no-store' })
    if (!res.ok) return undefined

    const data = (await res.json()) as YahooSummaryResponse
    const result = data.quoteSummary.result?.[0]

    const sector = result?.summaryProfile?.sector
    if (sector) return sector

    const weightings = result?.topHoldings?.sectorWeightings
    if (weightings && weightings.length > 0) return extractTopSector(weightings)
  } catch {
    // Echec silencieux — secteur optionnel
  }
  return undefined
}
