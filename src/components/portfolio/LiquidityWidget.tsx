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
    <div className="rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">Liquidités</p>
        <DepositButton />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] px-3 py-2.5">
          <p className="text-[10px] font-medium text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Total</p>
          <p className={`text-base font-bold tabular-nums ${total >= 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-red-text)]'}`}>
            {formatEur(total)}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] px-3 py-2.5">
          <p className="text-[10px] font-medium text-[var(--color-text-sub)] uppercase tracking-wide mb-1">PEA</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">{formatEur(pea)}</p>
        </div>
        <div className="rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] px-3 py-2.5">
          <p className="text-[10px] font-medium text-[var(--color-text-sub)] uppercase tracking-wide mb-1">CTO</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">{formatEur(autres)}</p>
        </div>
      </div>
    </div>
  )
}
