import type { Tables } from '@/types/database'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

interface Props {
  positions: Tables<'positions'>[]
}

/**
 * PortfolioSummary — Server Component.
 * Bandeau héro : valeur totale, P&L coloré, valeur investie, nombre de positions,
 * meilleure/pire position et compteurs gain/perte.
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

  // Calculs meilleure/pire position + compteurs
  const pnlByPosition = positions.map((pos, i) => {
    const q = quotes[i]
    if (!q) return null
    const p = toEur(q.price, q.currency, usdEur, gbpEur)
    if (p === null) return null
    const invested = pos.quantity * pos.pru
    const posPnl = pos.quantity * p - invested
    const posPnlPct = invested > 0 ? (posPnl / invested) * 100 : 0
    return { ticker: pos.ticker, pnl: posPnl, pnlPct: posPnlPct }
  }).filter((p): p is { ticker: string; pnl: number; pnlPct: number } => p !== null)

  const best = pnlByPosition.length > 0 ? pnlByPosition.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null
  const worst = pnlByPosition.length > 0 ? pnlByPosition.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null
  const countGain = pnlByPosition.filter((p) => p.pnl > 0).length
  const countLoss = pnlByPosition.filter((p) => p.pnl < 0).length

  return (
    <div className="glass-card rounded-[28px] px-4 py-5 sm:px-8 sm:py-7">
      {/* Étiquette */}
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-text-sub)]">
        Portefeuille
      </p>

      {/* Valeur totale + badge P&L sur la même ligne */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <p className="text-3xl sm:text-5xl font-bold tracking-tight tabular-nums text-[var(--color-text)] leading-none">
          {priced > 0 ? formatEur(totalValue) : '—'}
        </p>

        {priced > 0 && (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums ${
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

      {/* Stats secondaires ligne 1 : Investi / Plus-value / Perf. / Positions */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        <div className="border-b border-r border-[var(--color-border)] py-3 pr-4 sm:border-b-0 sm:pr-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Investi</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">
            {formatEur(totalInvested)}
          </p>
        </div>

        <div className="border-b border-[var(--color-border)] py-3 pl-4 sm:border-b-0 sm:border-r sm:px-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Plus-value</p>
          <p className={`text-base font-semibold tabular-nums ${
            priced > 0
              ? isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
              : 'text-[var(--color-text)]'
          }`}>
            {priced > 0 ? `${isGain ? '+' : ''}${formatEur(pnl)}` : '—'}
          </p>
        </div>

        <div className="border-r border-[var(--color-border)] py-3 pr-4 sm:px-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Perf.</p>
          <p className={`text-base font-semibold tabular-nums ${
            priced > 0
              ? isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
              : 'text-[var(--color-text)]'
          }`}>
            {priced > 0 ? formatPct(pnlPct) : '—'}
          </p>
        </div>

        <div className="py-3 pl-4 sm:pl-6">
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Positions</p>
          <p className="text-base font-semibold tabular-nums text-[var(--color-text)]">
            {positions.length}
          </p>
        </div>
      </div>

      {/* Séparateur */}
      {pnlByPosition.length > 0 && (
        <>
          <hr className="border-[var(--color-border)]/90" />

          {/* Stats secondaires ligne 2 : Meilleure / Pire / Gain / Perte */}
          <div className="grid grid-cols-2 sm:grid-cols-4">
            <div className="py-3 pr-4 sm:pr-6 border-r border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Meilleure</p>
              {best ? (
                <p className="text-base font-semibold text-[var(--color-text)] truncate">
                  {best.ticker}{' '}
                  <span className="tabular-nums text-[var(--color-green-text)]">
                    +{formatEur(best.pnl)}
                  </span>
                </p>
              ) : (
                <p className="text-base font-semibold text-[var(--color-text-sub)]">—</p>
              )}
            </div>

            <div className="py-3 pl-4 sm:px-6 sm:border-r border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">Pire</p>
              {worst ? (
                <p className="text-base font-semibold text-[var(--color-text)] truncate">
                  {worst.ticker}{' '}
                  <span className="tabular-nums text-[var(--color-red-text)]">
                    {formatEur(worst.pnl)}
                  </span>
                </p>
              ) : (
                <p className="text-base font-semibold text-[var(--color-text-sub)]">—</p>
              )}
            </div>

            <div className="py-3 pr-4 sm:px-6 border-t border-r border-[var(--color-border)] sm:border-t-0">
              <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">En gain</p>
              <p className="text-base font-semibold tabular-nums text-[var(--color-green-text)]">
                {countGain}
              </p>
            </div>

            <div className="py-3 pl-4 sm:pl-6 border-t border-[var(--color-border)] sm:border-t-0">
              <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-1">En perte</p>
              <p className="text-base font-semibold tabular-nums text-[var(--color-red-text)]">
                {countLoss}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
