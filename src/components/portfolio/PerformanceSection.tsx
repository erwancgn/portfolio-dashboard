import type { Tables } from '@/types/database'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { createClient } from '@/lib/supabase/server'
import PerformanceChart from './PerformanceChart'

export interface HeatmapEntry {
  ticker: string
  name: string | null
  changePercent: number
  value: number
  weight: number
}

export interface SnapshotEntry {
  date: string
  total_value: number
}

interface Props {
  positions: Tables<'positions'>[]
  userId: string
}

/**
 * PerformanceSection — Server Component.
 * Calcule la valeur totale du portfolio, upsert un snapshot quotidien,
 * charge l'historique des snapshots et prépare les données heatmap (variation 24h).
 */
export default async function PerformanceSection({ positions, userId }: Props) {
  if (positions.length === 0) return null

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  let totalValue = 0
  let totalInvested = 0
  const heatmapData: HeatmapEntry[] = []

  for (const [i, pos] of positions.entries()) {
    const q = quotes[i]
    const livePrice = q ? toEur(q.price, q.currency, usdEur, gbpEur) : null
    const value = livePrice !== null
      ? pos.quantity * livePrice
      : pos.quantity * pos.pru

    totalValue += value
    totalInvested += pos.quantity * pos.pru

    heatmapData.push({
      ticker: pos.ticker,
      name: pos.name ?? null,
      changePercent: q?.changePercent ?? 0,
      value,
      weight: 0, // calculé après
    })
  }

  // Calcul des poids une fois totalValue connu
  for (const entry of heatmapData) {
    entry.weight = totalValue > 0 ? entry.value / totalValue : 0
  }

  const totalPnl = totalValue - totalInvested

  // Upsert snapshot du jour
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('portfolio_snapshots').upsert(
    {
      user_id: userId,
      date: today,
      total_value: totalValue,
      total_invested: totalInvested,
      total_pnl: totalPnl,
    },
    { onConflict: 'user_id,date' },
  )

  // Fetch historique complet des snapshots
  const { data: rawSnapshots } = await supabase
    .from('portfolio_snapshots')
    .select('date, total_value')
    .eq('user_id', userId)
    .order('date', { ascending: true })

  const snapshots: SnapshotEntry[] = (rawSnapshots ?? [])
    .filter((s): s is { date: string; total_value: number } =>
      s.total_value !== null && s.total_value !== undefined,
    )

  return (
    <PerformanceChart
      snapshots={snapshots}
      heatmapData={heatmapData}
    />
  )
}
