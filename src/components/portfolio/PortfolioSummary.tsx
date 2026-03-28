import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

/**
 * PortfolioSummary — Server Component.
 * Hero section : valeur totale en grand, P&L coloré, stats secondaires.
 */
export default async function PortfolioSummary() {
  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('id, ticker, quantity, pru')

  if (!positions || positions.length === 0) {
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
    <div className="py-6">
      {/* Valeur hero */}
      <p className="text-sm text-[var(--color-text-sub)] mb-1">Valeur du portefeuille</p>
      <p className="text-4xl font-bold tracking-tight tabular-nums text-[var(--color-text)] mb-2">
        {priced > 0 ? formatEur(totalValue) : '—'}
      </p>

      {/* P&L */}
      {priced > 0 && (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium tabular-nums mb-6 ${
          isGain
            ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]'
            : 'bg-[var(--color-red-bg)] text-[var(--color-red-text)]'
        }`}>
          <span>{isGain ? '▲' : '▼'}</span>
          <span>{formatEur(pnl)}</span>
          <span>({formatPct(pnlPct)})</span>
        </div>
      )}

      {/* Stats secondaires */}
      <div className="flex gap-8">
        <div>
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-0.5">Investi</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">{formatEur(totalInvested)}</p>
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide mb-0.5">Positions</p>
          <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">{positions.length}</p>
        </div>
      </div>
    </div>
  )
}
