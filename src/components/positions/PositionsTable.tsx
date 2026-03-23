import type { Tables } from '@/types/database'
import type { QuoteResponse } from '@/app/api/quote/route'

type Position = Tables<'positions'>

interface PositionWithQuote extends Position {
  currentPrice: number | null
}

/** Formate un nombre en €, 2 décimales */
function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

/** Formate un pourcentage */
function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}

/**
 * Récupère le prix actuel d'une position via /api/quote.
 * Retourne null si la requête échoue ou si le ticker est inconnu.
 */
async function fetchCurrentPrice(
  ticker: string,
  type: Position['type'],
  baseUrl: string,
): Promise<number | null> {
  const quoteType = type === 'crypto' ? 'crypto' : 'stock'
  try {
    const res = await fetch(
      `${baseUrl}/api/quote?ticker=${encodeURIComponent(ticker)}&type=${quoteType}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = (await res.json()) as QuoteResponse
    return data.price ?? null
  } catch {
    return null
  }
}

/**
 * Récupère les positions depuis /api/positions.
 * Retourne un tableau vide en cas d'erreur.
 */
async function fetchPositions(baseUrl: string): Promise<Position[]> {
  try {
    const res = await fetch(`${baseUrl}/api/positions`, { cache: 'no-store' })
    if (!res.ok) return []
    return (await res.json()) as Position[]
  } catch {
    return []
  }
}

/**
 * PositionsTable — Server Component.
 * Affiche le tableau des positions avec P&L calculé en temps réel.
 */
export default async function PositionsTable() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const positions = await fetchPositions(baseUrl)

  if (positions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)]">
        Aucune position enregistrée. Ajoutez votre première position ci-dessus.
      </p>
    )
  }

  const positionsWithQuotes: PositionWithQuote[] = await Promise.all(
    positions.map(async (pos) => {
      const currentPrice = await fetchCurrentPrice(pos.ticker, pos.type, baseUrl)
      return { ...pos, currentPrice }
    }),
  )

  // Tri par valeur décroissante (positions sans prix à la fin)
  positionsWithQuotes.sort((a, b) => {
    const valA = a.currentPrice !== null ? a.quantity * a.currentPrice : -1
    const valB = b.currentPrice !== null ? b.quantity * b.currentPrice : -1
    return valB - valA
  })

  // Valeur totale du portfolio (positions avec prix connu uniquement)
  const totalValue = positionsWithQuotes.reduce((sum, pos) => {
    return pos.currentPrice !== null ? sum + pos.quantity * pos.currentPrice : sum
  }, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-[var(--color-text-sub)]">
            <th className="py-2 pr-4 font-semibold">Ticker</th>
            <th className="py-2 pr-4 font-semibold">Nom</th>
            <th className="py-2 pr-4 font-semibold">Type</th>
            <th className="py-2 pr-4 font-semibold text-right">Quantité</th>
            <th className="py-2 pr-4 font-semibold text-right">PRU</th>
            <th className="py-2 pr-4 font-semibold text-right">Prix actuel</th>
            <th className="py-2 pr-4 font-semibold text-right">Valeur</th>
            <th className="py-2 pr-4 font-semibold text-right">P&L (€)</th>
            <th className="py-2 pr-4 font-semibold text-right">P&L (%)</th>
            <th className="py-2 font-semibold text-right">Poids</th>
          </tr>
        </thead>
        <tbody>
          {positionsWithQuotes.map((pos) => {
            const hasPrice = pos.currentPrice !== null
            const valeur = hasPrice ? pos.quantity * pos.currentPrice! : null
            const invested = pos.quantity * pos.pru
            const pnl = valeur !== null ? valeur - invested : null
            const pnlPct = pnl !== null ? (pnl / invested) * 100 : null
            const poids = valeur !== null && totalValue > 0 ? (valeur / totalValue) * 100 : null

            const pnlColor =
              pnl === null
                ? ''
                : pnl >= 0
                  ? 'text-green-500'
                  : 'text-red-500'

            return (
              <tr
                key={pos.id}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] transition-colors"
              >
                <td className="py-2 pr-4 font-mono font-semibold text-[var(--color-text)]">
                  {pos.ticker}
                </td>
                <td className="py-2 pr-4 text-[var(--color-text-sub)]">
                  {pos.name ?? '—'}
                </td>
                <td className="py-2 pr-4 text-[var(--color-text-sub)] capitalize">
                  {pos.type}
                </td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">
                  {pos.quantity}
                </td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">
                  {formatEur(pos.pru)}
                </td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">
                  {hasPrice ? formatEur(pos.currentPrice!) : '—'}
                </td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">
                  {valeur !== null ? formatEur(valeur) : '—'}
                </td>
                <td className={`py-2 pr-4 text-right font-medium ${pnlColor}`}>
                  {pnl !== null ? formatEur(pnl) : '—'}
                </td>
                <td className={`py-2 pr-4 text-right font-medium ${pnlColor}`}>
                  {pnlPct !== null ? formatPct(pnlPct) : '—'}
                </td>
                <td className="py-2 text-right text-[var(--color-text-sub)]">
                  {poids !== null ? `${poids.toFixed(1)} %` : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
