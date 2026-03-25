import { createClient } from '@/lib/supabase/server'
import { fetchQuote, fetchRate, toEur } from '@/lib/quote'
import { formatEur, formatPct } from '@/lib/format'

/**
 * PnlStats — Server Component.
 * Affiche 4 StatCards P&L : meilleure position, pire position,
 * nombre de positions en gain, nombre de positions en perte.
 * Utilise le meme pattern que PortfolioSummary.
 * Les appels fetchQuote/fetchRate sont dedupliques via React cache().
 */
export default async function PnlStats() {
  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('id, ticker, quantity, pru, name')

  if (!positions || positions.length === 0) {
    return null
  }

  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker))),
    fetchRate('USD', 'EUR'),
  ])

  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  // Calcul du P&L par position (null si prix indisponible)
  const pnlByPosition = positions.map((pos, i) => {
    const quote = quotes[i]
    if (!quote) return null
    const priceEur = toEur(quote.price, quote.currency, usdEur, gbpEur)
    if (priceEur === null) return null
    const invested = pos.quantity * pos.pru
    const pnl = pos.quantity * priceEur - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0
    return { ticker: pos.ticker, name: pos.name, pnl, pnlPct }
  })

  const positionsWithPnl = pnlByPosition.filter(
    (p): p is { ticker: string; name: string | null; pnl: number; pnlPct: number } => p !== null,
  )

  if (positionsWithPnl.length === 0) {
    return null
  }

  // Meilleure et pire position
  const best = positionsWithPnl.reduce((a, b) => (b.pnl > a.pnl ? b : a))
  const worst = positionsWithPnl.reduce((a, b) => (b.pnl < a.pnl ? b : a))

  const countGain = positionsWithPnl.filter((p) => p.pnl > 0).length
  const countLoss = positionsWithPnl.filter((p) => p.pnl < 0).length

  return (
    <div className="rounded-xl p-6 mb-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        P&amp;L par position
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            Meilleure position
          </span>
          <span className="text-base font-bold text-[var(--color-text)]">
            {best.ticker}
          </span>
          <span className="text-xl font-bold text-green-500">
            {formatEur(best.pnl)}
          </span>
          <span className="text-sm font-medium text-green-500">
            {formatPct(best.pnlPct)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            Pire position
          </span>
          <span className="text-base font-bold text-[var(--color-text)]">
            {worst.ticker}
          </span>
          <span className="text-xl font-bold text-red-500">
            {formatEur(worst.pnl)}
          </span>
          <span className="text-sm font-medium text-red-500">
            {formatPct(worst.pnlPct)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            En gain
          </span>
          <span className="text-xl font-bold text-green-500">
            {countGain}
          </span>
          <span className="text-sm text-[var(--color-text-sub)]">
            position{countGain > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-sub)] uppercase tracking-wide">
            En perte
          </span>
          <span className="text-xl font-bold text-red-500">
            {countLoss}
          </span>
          <span className="text-sm text-[var(--color-text-sub)]">
            position{countLoss > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
