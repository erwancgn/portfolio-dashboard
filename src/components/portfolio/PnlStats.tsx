import type { Tables } from '@/types/database'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

interface Props {
  positions: Tables<'positions'>[]
}

/**
 * PnlStats — Server Component.
 * Ligne compacte : meilleure/pire position + compteurs gain/perte.
 */
export default async function PnlStats({ positions }: Props) {
  if (positions.length === 0) return null

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  const pnlByPosition = positions.map((pos, i) => {
    const q = quotes[i]
    if (!q) return null
    const p = toEur(q.price, q.currency, usdEur, gbpEur)
    if (p === null) return null
    const invested = pos.quantity * pos.pru
    const pnl = pos.quantity * p - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    return { ticker: pos.ticker, pnl, pnlPct }
  }).filter((p): p is { ticker: string; pnl: number; pnlPct: number } => p !== null)

  if (pnlByPosition.length === 0) return null

  const best = pnlByPosition.reduce((a, b) => (b.pnl > a.pnl ? b : a))
  const worst = pnlByPosition.reduce((a, b) => (b.pnl < a.pnl ? b : a))
  const countGain = pnlByPosition.filter((p) => p.pnl > 0).length
  const countLoss = pnlByPosition.filter((p) => p.pnl < 0).length

  return (
    <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">Meilleure</span>
        <span className="text-sm font-semibold text-[var(--color-text)]">{best.ticker}</span>
        <span className="text-sm font-semibold tabular-nums text-[var(--color-green-text)]">
          {formatEur(best.pnl)} ({formatPct(best.pnlPct)})
        </span>
      </div>
      <div className="w-px bg-[var(--color-border)]" />
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">Pire</span>
        <span className="text-sm font-semibold text-[var(--color-text)]">{worst.ticker}</span>
        <span className="text-sm font-semibold tabular-nums text-[var(--color-red-text)]">
          {formatEur(worst.pnl)} ({formatPct(worst.pnlPct)})
        </span>
      </div>
      <div className="w-px bg-[var(--color-border)]" />
      <div className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-[var(--color-green-text)] font-medium">{countGain} en gain</span>
        <span className="text-sm tabular-nums text-[var(--color-red-text)] font-medium">{countLoss} en perte</span>
      </div>
    </div>
  )
}
