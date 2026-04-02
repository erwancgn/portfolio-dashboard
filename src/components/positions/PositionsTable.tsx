import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import type { Tables } from '@/types/database'
import PositionsTableView from './PositionsTableView'

type Position = Tables<'positions'>

interface Props {
  positions: Position[]
}

export interface PositionRow extends Position {
  priceEur: number | null
  valeur: number | null
  pnl: number | null
  pnlPct: number | null
  poids: number | null
}

/** Map position_id → règle DCA active (ou undefined si aucune) */
export type DcaRuleMap = Record<string, { id: string; is_active: boolean | null } | undefined>

/**
 * PositionsTable — Server Component.
 * Reçoit les positions depuis la page parente, calcule P&L, délègue l'affichage à PositionsTableView (Client).
 * Les données statiques (isin, sector, logo_url…) sont stockées en DB à la création — pas d'appel FMP ici.
 */
export default async function PositionsTable({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)] py-8 text-center">
        Aucune position. Cliquez sur &quot;+ Nouvelle position&quot; pour commencer.
      </p>
    )
  }

  const supabase = await createClient()

  const [quotes, usdEur, dcaData] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
    supabase
      .from('dca_rules')
      .select('id, position_id, is_active')
      .eq('is_active', true),
  ])

  // Construire la map position_id → règle DCA active
  const dcaRules: DcaRuleMap = {}
  for (const rule of dcaData.data ?? []) {
    if (rule.position_id) {
      dcaRules[rule.position_id] = { id: rule.id, is_active: rule.is_active }
    }
  }

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

  return <PositionsTableView rows={rows} dcaRules={dcaRules} />
}
