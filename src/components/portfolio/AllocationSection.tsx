import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import AllocationChart from './AllocationChart'

export interface AllocationEntry {
  label: string
  value: number
}

/**
 * AllocationSection — Server Component.
 * Agrège les positions par enveloppe et par secteur avec les prix live.
 * Fallback sur quantité × PRU si le prix est indisponible.
 * React cache() déduplique les appels fetchQuote identiques sur la page.
 */
export default async function AllocationSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: positions } = await supabase
    .from('positions')
    .select('ticker, envelope, sector, quantity, pru')
    .eq('user_id', user.id)

  if (!positions || positions.length === 0) return null

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  const byEnvelope = new Map<string, number>()
  const bySector = new Map<string, number>()

  for (const [i, pos] of positions.entries()) {
    const q = quotes[i]
    const livePrice = q ? toEur(q.price, q.currency, usdEur, gbpEur) : null
    const value = livePrice !== null
      ? pos.quantity * livePrice
      : pos.quantity * pos.pru

    const envelope = pos.envelope ?? 'Autre'
    byEnvelope.set(envelope, (byEnvelope.get(envelope) ?? 0) + value)

    if (pos.sector) {
      bySector.set(pos.sector, (bySector.get(pos.sector) ?? 0) + value)
    }
  }

  const envelopeData: AllocationEntry[] = Array.from(byEnvelope.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  const sectorData: AllocationEntry[] = Array.from(bySector.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  return <AllocationChart envelopeData={envelopeData} sectorData={sectorData} />
}
