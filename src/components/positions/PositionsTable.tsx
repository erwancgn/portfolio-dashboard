import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import type { Tables } from '@/types/database'
import PositionsTableView from './PositionsTableView'

type Position = Tables<'positions'>

export interface PositionRow extends Position {
  priceEur: number | null
  valeur: number | null
  pnl: number | null
  pnlPct: number | null
  poids: number | null
}

/**
 * PositionsTable — Server Component.
 * Récupère positions + prix, calcule P&L, délègue l'affichage à PositionsTableView (Client).
 */
export default async function PositionsTable() {
  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!positions || positions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)] py-8 text-center">
        Aucune position. Cliquez sur &quot;+ Nouvelle position&quot; pour commencer.
      </p>
    )
  }

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  const totalValue = positions.reduce((sum, pos, i) => {
    const q = quotes[i]
    if (!q) return sum
    const p = toEur(q.price, q.currency, usdEur, gbpEur)
    return p !== null ? sum + pos.quantity * p : sum
  }, 0)

  const rows: PositionRow[] = positions.map((pos, i) => {
    const q = quotes[i]
    const priceEur = q ? toEur(q.price, q.currency, usdEur, gbpEur) : null
    const valeur = priceEur !== null ? pos.quantity * priceEur : null
    const invested = pos.quantity * pos.pru
    const pnl = valeur !== null ? valeur - invested : null
    const pnlPct = pnl !== null && invested > 0 ? (pnl / invested) * 100 : null
    const poids = valeur !== null && totalValue > 0 ? (valeur / totalValue) * 100 : null
    return { ...pos, priceEur, valeur, pnl, pnlPct, poids }
  })

  rows.sort((a, b) => {
    if (a.pnl === null && b.pnl === null) return 0
    if (a.pnl === null) return 1
    if (b.pnl === null) return -1
    return b.pnl - a.pnl
  })

  return <PositionsTableView rows={rows} />
}
