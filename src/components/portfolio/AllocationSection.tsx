import { createClient } from '@/lib/supabase/server'
import AllocationChart from './AllocationChart'

export interface AllocationEntry {
  label: string
  value: number
}

/**
 * AllocationSection — Server Component.
 * Agrège les positions par enveloppe et par secteur (valeur investie = quantité × PRU).
 * Passe les données agrégées au composant Client AllocationChart.
 */
export default async function AllocationSection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: positions } = await supabase
    .from('positions')
    .select('envelope, sector, quantity, pru')
    .eq('user_id', user.id)

  if (!positions || positions.length === 0) return null

  const byEnvelope = new Map<string, number>()
  const bySector = new Map<string, number>()

  for (const pos of positions) {
    const value = pos.quantity * pos.pru
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
