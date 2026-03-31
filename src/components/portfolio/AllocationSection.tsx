import type { Tables } from '@/types/database'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import AllocationChart from './AllocationChart'

export interface AllocationEntry {
  label: string
  value: number
}

interface Props {
  positions: Tables<'positions'>[]
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

/** Trie une Map<string, number> en AllocationEntry[] décroissant par valeur. */
function toSorted(map: Map<string, number>): AllocationEntry[] {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * AllocationSection — Server Component.
 * Agrège les positions par enveloppe, secteur, poids (ticker) et pays.
 * Prix live via fetchQuote — fallback sur quantité × PRU si indisponible.
 * React cache() déduplique les appels fetchQuote identiques sur la page.
 */
export default async function AllocationSection({ positions }: Props) {
  if (positions.length === 0) return null

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  const byEnvelope = new Map<string, number>()
  const bySector = new Map<string, number>()
  const byWeight = new Map<string, number>()
  const byCountry = new Map<string, number>()

  for (const [i, pos] of positions.entries()) {
    const q = quotes[i]
    const livePrice = q ? toEur(q.price, q.currency, usdEur, gbpEur) : null
    const value = livePrice !== null
      ? pos.quantity * livePrice
      : pos.quantity * pos.pru

    byEnvelope.set(pos.envelope ?? 'Autre', (byEnvelope.get(pos.envelope ?? 'Autre') ?? 0) + value)

    if (pos.sector) {
      bySector.set(pos.sector, (bySector.get(pos.sector) ?? 0) + value)
    }

    const tickerLabel = pos.name ? `${pos.ticker} — ${pos.name}` : pos.ticker
    byWeight.set(tickerLabel, (byWeight.get(tickerLabel) ?? 0) + value)

    const country = getCountry(pos.ticker)
    byCountry.set(country, (byCountry.get(country) ?? 0) + value)
  }

  return (
    <AllocationChart
      envelopeData={toSorted(byEnvelope)}
      sectorData={toSorted(bySector)}
      weightData={toSorted(byWeight)}
      countryData={toSorted(byCountry)}
    />
  )
}
