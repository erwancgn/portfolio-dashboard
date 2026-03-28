import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import AnalyseChart from './AnalyseChart'

export interface AnalyseRow {
  label: string
  value: number
  pct: number
}

/** Dérive le pays à partir du suffix du ticker. */
function getCountry(ticker: string): string {
  if (ticker.includes('-')) return 'Crypto'
  if (ticker.endsWith('.PA')) return 'France'
  if (ticker.endsWith('.MI')) return 'Italie'
  if (ticker.endsWith('.L')) return 'Royaume-Uni'
  if (ticker.endsWith('.AS')) return 'Pays-Bas'
  if (ticker.endsWith('.BR')) return 'Belgique'
  if (ticker.endsWith('.DE') || ticker.endsWith('.F')) return 'Allemagne'
  if (ticker.endsWith('.MC')) return 'Espagne'
  return 'États-Unis'
}

/** Trie une Map<string, number> en tableau AnalyseRow décroissant par valeur. */
function toSortedRows(map: Map<string, number>, total: number): AnalyseRow[] {
  return Array.from(map.entries())
    .map(([label, value]) => ({
      label,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * AnalyseSection — Server Component.
 * Calcule la valeur actuelle avec les prix live (Yahoo Finance via fetchQuote).
 * Fallback sur quantité × PRU si le prix est indisponible.
 * React cache() déduplique les appels fetchQuote entre composants du même rendu.
 * Agrège par titre (Poids), par secteur et par pays.
 */
export default async function AnalyseSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: positions } = await supabase
    .from('positions')
    .select('ticker, name, sector, quantity, pru')
    .eq('user_id', user.id)

  if (!positions || positions.length === 0) return null

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  let total = 0
  const byTicker = new Map<string, number>()
  const bySector = new Map<string, number>()
  const byCountry = new Map<string, number>()

  for (const [i, pos] of positions.entries()) {
    const q = quotes[i]
    const livePrice = q ? toEur(q.price, q.currency, usdEur, gbpEur) : null
    const value = livePrice !== null
      ? pos.quantity * livePrice
      : pos.quantity * pos.pru

    total += value

    const tickerLabel = pos.name ? `${pos.ticker} — ${pos.name}` : pos.ticker
    byTicker.set(tickerLabel, (byTicker.get(tickerLabel) ?? 0) + value)

    const sector = pos.sector ?? 'Non classé'
    bySector.set(sector, (bySector.get(sector) ?? 0) + value)

    const country = getCountry(pos.ticker)
    byCountry.set(country, (byCountry.get(country) ?? 0) + value)
  }

  return (
    <AnalyseChart
      weightData={toSortedRows(byTicker, total)}
      sectorData={toSortedRows(bySector, total)}
      countryData={toSortedRows(byCountry, total)}
    />
  )
}
