import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

/**
 * PortfolioSummary — Server Component.
 * Affiche les indicateurs globaux du portefeuille :
 * total investi, valeur actuelle, P&L global (€ et %).
 * Les prix non-EUR sont convertis via Frankfurter.
 */
export default async function PortfolioSummary() {
  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('id, ticker, quantity, pru')

  if (!positions || positions.length === 0) {
    return null
  }

  // Recuperation des prix et du taux USD→EUR en parallele
  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  // GBP→EUR uniquement si au moins une position en GBP
  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  // Calcul des totaux
  let totalInvested = 0
  let totalValue = 0
  let positionsWithPrice = 0

  positions.forEach((pos, i) => {
    totalInvested += pos.quantity * pos.pru

    const quote = quotes[i]
    if (quote) {
      const priceEur = toEur(quote.price, quote.currency, usdEur, gbpEur)
      if (priceEur !== null) {
        totalValue += pos.quantity * priceEur
        positionsWithPrice++
      }
    }
  })

  const pnl = totalValue - totalInvested
  const pnlPct = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0
  const pnlColor = pnl >= 0 ? 'text-green-500' : 'text-red-500'
  const positionCount = positions.length

  return (
    <div className="rounded-xl p-6 mb-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        Vue globale
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            Total investi
          </span>
          <span className="text-xl font-bold text-[var(--color-text)]">
            {formatEur(totalInvested)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            Valeur actuelle
          </span>
          <span className="text-xl font-bold text-[var(--color-text)]">
            {positionsWithPrice > 0 ? formatEur(totalValue) : '—'}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            P&L global
          </span>
          <span className={`text-xl font-bold ${positionsWithPrice > 0 ? pnlColor : 'text-[var(--color-text)]'}`}>
            {positionsWithPrice > 0 ? formatEur(pnl) : '—'}
          </span>
          {positionsWithPrice > 0 && (
            <span className={`text-sm font-medium ${pnlColor}`}>
              {formatPct(pnlPct)}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            Positions
          </span>
          <span className="text-xl font-bold text-[var(--color-text)]">
            {positionCount}
          </span>
        </div>
      </div>
    </div>
  )
}
