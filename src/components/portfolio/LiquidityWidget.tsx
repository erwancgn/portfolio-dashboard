import { createClient } from '@/lib/supabase/server'
import { formatEur } from '@/lib/format'
import DepositButton from '@/components/portfolio/DepositButton'

/**
 * LiquidityWidget — Server Component.
 * Affiche les liquidités totales, PEA séparé vs reste.
 * Inclut DepositButton pour les apports/retraits manuels.
 */
export default async function LiquidityWidget() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from('liquidities')
    .select('envelope, amount')
    .eq('user_id', user.id)

  const liquidities = rows ?? []
  const total = liquidities.reduce((s, r) => s + r.amount, 0)
  const pea = liquidities.find((r) => r.envelope === 'PEA')?.amount ?? 0
  const autres = total - pea

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
      <div className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-0.5">Liquidités totales</p>
          <p className={`text-xl font-bold ${total >= 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-red-text)]'}`}>
            {formatEur(total)}
          </p>
        </div>
        <div className="w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-0.5">PEA</p>
          <p className="text-sm font-semibold text-[var(--color-text)]">{formatEur(pea)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-0.5">CTO / Autre</p>
          <p className="text-sm font-semibold text-[var(--color-text)]">{formatEur(autres)}</p>
        </div>
      </div>
      <DepositButton />
    </div>
  )
}
