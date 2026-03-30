import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { fetchFmpProfile } from '@/lib/fmp'
import type { Tables } from '@/types/database'
import PositionsTableView from './PositionsTableView'

type Position = Tables<'positions'>

/**
 * Enrichit en arrière-plan les positions sans ISIN ou secteur via FMP.
 * Met à jour la DB et retourne les positions fusionnées pour le rendu courant.
 */
async function enrichPositions(
  positions: Position[],
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Position[]> {
  const toEnrich = positions.filter((p) => !p.isin || !p.sector)
  if (toEnrich.length === 0) return positions

  const profiles = await Promise.allSettled(
    toEnrich.map((p) => fetchFmpProfile(p.ticker)),
  )

  const enriched = new Map<string, Partial<Position>>()
  const updates: Promise<unknown>[] = []

  toEnrich.forEach((pos, i) => {
    const result = profiles[i]
    if (result.status !== 'fulfilled' || !result.value) return
    const fmp = result.value
    const patch: Partial<Position> = {}
    if (!pos.isin && fmp.isin) patch.isin = fmp.isin
    if (!pos.sector && fmp.sector) patch.sector = fmp.sector
    if (!pos.logo_url && fmp.logoUrl) patch.logo_url = fmp.logoUrl
    if (!pos.industry && fmp.industry) patch.industry = fmp.industry
    if (!pos.country && fmp.country) patch.country = fmp.country
    if (Object.keys(patch).length === 0) return
    enriched.set(pos.id, patch)
    updates.push(Promise.resolve(supabase.from('positions').update(patch).eq('id', pos.id)))
  })

  // Persiste en DB sans bloquer le rendu
  void Promise.allSettled(updates)

  return positions.map((p) => {
    const patch = enriched.get(p.id)
    return patch ? { ...p, ...patch } : p
  })
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
 * Récupère positions + prix, calcule P&L, délègue l'affichage à PositionsTableView (Client).
 */
export default async function PositionsTable() {
  const supabase = await createClient()
  const { data: raw } = await supabase
    .from('positions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!raw || raw.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)] py-8 text-center">
        Aucune position. Cliquez sur &quot;+ Nouvelle position&quot; pour commencer.
      </p>
    )
  }

  const [positions, quotes, usdEur, dcaData] = await Promise.all([
    enrichPositions(raw, supabase),
    Promise.all(raw.map((pos) => fetchQuote(pos.ticker))),
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
