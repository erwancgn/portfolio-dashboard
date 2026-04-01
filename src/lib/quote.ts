import { cache } from 'react'

/** Reponse brute de l'API Yahoo Finance /chart */
interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number
        regularMarketChangePercent?: number
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

/** Resultat d'un appel au prix avec devise */
export interface QuoteResult {
  price: number
  currency: string
  changePercent?: number
}

/** Reponse brute Frankfurter */
interface FrankfurterResponse {
  rates: Record<string, number>
}

/**
 * Recupere le prix et la devise d'un actif via Yahoo Finance.
 * Couvre actions, ETF et crypto (ex: BTC-EUR, ETH-USD).
 * Retourne null si l'actif est introuvable ou en cas d'erreur reseau.
 * Deduplique les appels identiques dans le meme cycle de rendu via React cache().
 */
export const fetchQuote = cache(async function fetchQuote(ticker: string): Promise<QuoteResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null

    const data = (await res.json()) as YahooChartResponse
    if (data.chart.error || !data.chart.result || data.chart.result.length === 0) {
      return null
    }

    const meta = data.chart.result[0].meta
    return {
      price: meta.regularMarketPrice,
      currency: meta.currency,
      changePercent: meta.regularMarketChangePercent,
    }
  } catch {
    return null
  }
})

/**
 * Recupere un taux de change via Frankfurter (sans cle API).
 * Retourne 1 si les devises sont identiques ou en cas d'echec.
 * Deduplique les appels identiques dans le meme cycle de rendu via React cache().
 */
export const fetchRate = cache(async function fetchRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return 1
    const data = (await res.json()) as FrankfurterResponse
    return data.rates[to] ?? 1
  } catch {
    return 1
  }
})

/**
 * Convertit un prix depuis sa devise vers EUR.
 * GBp (pence britanniques) : divise par 100 avant d'appliquer le taux GBP→EUR.
 * Retourne null si la devise est inconnue.
 */
export function toEur(
  price: number,
  currency: string,
  usdEur: number,
  gbpEur: number,
): number | null {
  if (currency === 'EUR') return price
  if (currency === 'USD') return price * usdEur
  if (currency === 'GBp') return (price / 100) * gbpEur
  if (currency === 'GBP') return price * gbpEur
  return null
}
