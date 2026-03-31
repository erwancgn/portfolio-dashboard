import type { Tables } from '@/types/database'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

interface Props {
  positions: Tables<'positions'>[]
}

/**
 * PortfolioSummary — Server Component.
 * Bandeau héro : valeur totale, P&L coloré, valeur investie, nombre de positions.
 * Style épuré inspiré Trade Republic / Moning.
 */
export default async function PortfolioSummary({ positions }: Props) {
  if (positions.length === 0) {
    return (
      <div className="py-10 text-center text-[var(--color-text-sub)] text-sm">
        Aucune position. Ajoutez votre première position pour commencer.
      </div>
    )
  }

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  let totalInvested = 0
  let totalValue = 0
  let priced = 0

  positions.forEach((pos, i) => {
    totalInvested += pos.quantity * pos.pru
    const q = quotes[i]
    if (q) {
      const p = toEur(q.price, q.currency, usdEur, gbpEur)
      if (p !== null) { totalValue += pos.quantity * p; priced++ }
    }
  })

  const pnl = totalValue - totalInvested
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0
  const isGain = pnl >= 0

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 sm:px-8 py-5 sm:py-7">
      {/* Étiquette */}
      <p className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-widest mb-3">
        Portefeuille
      </p>

      {/* Valeur totale + badge P&L sur la même ligne */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <p className="text-3xl sm:text-5xl font-bold tracking-tight tabular-nums text-[var(--color-text)] leading-none">
          {priced > 0 ? formatEur(totalValue) : '—'}
        </p>

        {priced > 0 && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold tabular-nums ${
            isGain
              ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]'
              : 'bg-[var(--color-red-bg)] text-[var(--color-red-text)]'
          }`}>
            <span className="text-xs">{isGain ? '▲' : '▼'}</span>
            <span>{isGain ? '+' : ''}{formatEur(pnl)}</span>
            <span className="opacity-80">({formatPct(pnlPct)})</span>
          </div>
        )}
      </div>

      {/* Stats secondaires : séparateur vertical */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-0 sm:divide-x sm:divide-[var(--color-border)]">
        <div className="sm:pr-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Investi</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">
            {formatEur(totalInvested)}
          </p>
        </div>

        <div className="sm:px-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Plus-value</p>
          <p className={`text-base font-semibold tabular-nums ${
            priced > 0
              ? isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
              : 'text-[var(--color-text)]'
          }`}>
            {priced > 0 ? `${isGain ? '+' : ''}${formatEur(pnl)}` : '—'}
          </p>
        </div>

        <div className="sm:px-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Perf.</p>
          <p className={`text-base font-semibold tabular-nums ${
            priced > 0
              ? isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
              : 'text-[var(--color-text)]'
          }`}>
            {priced > 0 ? formatPct(pnlPct) : '—'}
          </p>
        </div>

        <div className="sm:pl-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Positions</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">
            {positions.length}
          </p>
        </div>
      </div>
    </div>
  )
}
