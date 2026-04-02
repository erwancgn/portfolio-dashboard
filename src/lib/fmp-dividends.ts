/**
 * Récupération et projection des dividendes via FMP.
 * Endpoint : GET /stable/dividends/{symbol}
 * Clé API lue via process.env.FMP_API_KEY — jamais exposée côté client.
 */
import { readThroughTtlCache } from '@/lib/cache'
import {
  detectFrequency,
  calcAnnualDividendPerShare,
  projectDividends,
  PERIODS_PER_YEAR,
} from '@/lib/fmp-dividends-helpers'

const FMP_DIVIDENDS_TTL_MS = 6 * 60 * 60 * 1000 // 6h

/** Entrée brute retournée par FMP /stable/dividends/{symbol} */
interface FmpDividendRaw {
  date?: string
  adjDividend?: number
  dividend?: number
  recordDate?: string
  paymentDate?: string
  declarationDate?: string
}

/** Dividende normalisé */
export interface DividendEntry {
  date: string
  amount: number
  recordDate: string | null
  paymentDate: string | null
  declarationDate: string | null
}

/** Fréquence de versement détectée */
export type DividendFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'unknown'

/** Résultat complet pour un ticker */
export interface TickerDividendData {
  ticker: string
  frequency: DividendFrequency
  annualDividendPerShare: number
  history: DividendEntry[]
  projected: DividendEntry[]
}

/**
 * Récupère l'historique brut des dividendes d'un ticker via FMP.
 * Retourne null si l'actif ne distribue pas de dividendes ou en cas d'erreur.
 *
 * @param ticker - Symbole boursier (ex: AAPL, MC.PA)
 * @param apiKey - Clé FMP
 */
async function fetchRawDividends(
  ticker: string,
  apiKey: string,
): Promise<DividendEntry[] | null> {
  try {
    const url = `https://financialmodelingprep.com/stable/dividends/${encodeURIComponent(ticker)}?apikey=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 21600 } })

    if (!res.ok) return null

    const data = (await res.json()) as FmpDividendRaw[] | Record<string, unknown>
    const rawArray: FmpDividendRaw[] = Array.isArray(data) ? data : []

    if (rawArray.length === 0) return null

    return rawArray
      .filter((d): d is FmpDividendRaw & { date: string } => typeof d.date === 'string')
      .map((d) => ({
        date: d.date,
        amount: d.adjDividend ?? d.dividend ?? 0,
        recordDate: d.recordDate ?? null,
        paymentDate: d.paymentDate ?? null,
        declarationDate: d.declarationDate ?? null,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
  } catch (err) {
    console.error(`[fmp-dividends] fetchRawDividends error for ${ticker}:`, err)
    return null
  }
}

/**
 * Récupère l'historique + projections de dividendes pour un ticker.
 * Met en cache 6h. Retourne null si aucun dividende n'est trouvé.
 *
 * @param ticker - Symbole boursier
 */
export async function fetchTickerDividends(ticker: string): Promise<TickerDividendData | null> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) {
    console.error('[fmp-dividends] FMP_API_KEY manquante')
    return null
  }

  return readThroughTtlCache(`fmp:dividends:${ticker}`, FMP_DIVIDENDS_TTL_MS, async () => {
    const history = await fetchRawDividends(ticker, apiKey)
    if (!history || history.length === 0) return null

    const frequency = detectFrequency(history)
    const annualDividendPerShare = calcAnnualDividendPerShare(history, frequency)

    const periodsPerYear = PERIODS_PER_YEAR[frequency]
    const perPaymentAmount =
      frequency === 'unknown' || annualDividendPerShare === 0
        ? 0
        : annualDividendPerShare / periodsPerYear

    const projected = history[0]
      ? projectDividends(history[0], frequency, perPaymentAmount)
      : []

    return {
      ticker,
      frequency,
      annualDividendPerShare,
      history,
      projected,
    }
  })
}
