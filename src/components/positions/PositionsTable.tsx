import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database'
import type { QuoteResponse } from '@/app/api/quote/route'

type Position = Tables<'positions'>

interface PositionWithPrice extends Position {
  priceEur: number | null
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

/** Reponse brute Frankfurter */
interface FrankfurterResponse {
  rates: Record<string, number>
}

/**
 * Recupere un taux de change depuis Frankfurter (gratuit, sans cle).
 * Retourne 1 si from === to, ou un taux de repli si l'API echoue.
 */
async function fetchRate(from: string, to: string): Promise<number> {
  if (from === to) return 1
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return 1
    const data = (await res.json()) as FrankfurterResponse
    return data.rates[to] ?? 1
  } catch {
    return 1
  }
}

/**
 * Recupere le prix actuel d'un actif via /api/quote.
 * Retourne { price, currency } ou null en cas d'echec.
 */
async function fetchQuote(
  ticker: string,
  baseUrl: string,
): Promise<{ price: number; currency: string } | null> {
  try {
    const res = await fetch(
      `${baseUrl}/api/quote?ticker=${encodeURIComponent(ticker)}`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const data = (await res.json()) as QuoteResponse
    return { price: data.price, currency: data.currency }
  } catch {
    return null
  }
}

/**
 * PositionsTable — Server Component.
 * Affiche le tableau des positions avec P&L calculé en temps réel.
 * Les prix non-EUR sont convertis en EUR via Frankfurter.
 */
export default async function PositionsTable() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const supabase = await createClient()
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .order('created_at', { ascending: false })

  if (!positions || positions.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)]">
        Aucune position enregistrée. Ajoutez votre première position ci-dessus.
      </p>
    )
  }

  // Recuperation des prix et du taux USD→EUR en parallele
  const [quotes, usdEur] = await Promise.all([
    Promise.all(positions.map((pos) => fetchQuote(pos.ticker, baseUrl))),
    fetchRate('USD', 'EUR'),
  ])

  /**
   * Convertit un prix dans sa devise vers EUR.
   * GBp (pence) → divise par 100 avant conversion GBP→EUR.
   */
  function toEur(price: number, currency: string, gbpEur: number): number | null {
    if (currency === 'EUR') return price
    if (currency === 'USD') return price * usdEur
    if (currency === 'GBp') return (price / 100) * gbpEur
    if (currency === 'GBP') return price * gbpEur
    return null
  }

  // GBP→EUR uniquement si au moins une position en GBP
  const needsGbp = quotes.some((q) => q?.currency === 'GBP' || q?.currency === 'GBp')
  const gbpEur = needsGbp ? await fetchRate('GBP', 'EUR') : 1

  const positionsWithPrice: PositionWithPrice[] = positions.map((pos, i) => {
    const quote = quotes[i]
    const priceEur = quote ? toEur(quote.price, quote.currency, gbpEur) : null
    return { ...pos, priceEur }
  })

  // Tri par valeur décroissante (positions sans prix à la fin)
  positionsWithPrice.sort((a, b) => {
    const valA = a.priceEur !== null ? a.quantity * a.priceEur : -1
    const valB = b.priceEur !== null ? b.quantity * b.priceEur : -1
    return valB - valA
  })

  // Valeur totale (positions avec prix connu uniquement)
  const totalValue = positionsWithPrice.reduce((sum, pos) => {
    return pos.priceEur !== null ? sum + pos.quantity * pos.priceEur : sum
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
          {positionsWithPrice.map((pos) => {
            const hasPrice = pos.priceEur !== null
            const valeur = hasPrice ? pos.quantity * pos.priceEur! : null
            const invested = pos.quantity * pos.pru
            const pnl = valeur !== null ? valeur - invested : null
            const pnlPct = pnl !== null ? (pnl / invested) * 100 : null
            const poids = valeur !== null && totalValue > 0 ? (valeur / totalValue) * 100 : null

            const pnlColor =
              pnl === null ? '' : pnl >= 0 ? 'text-green-500' : 'text-red-500'

            return (
              <tr
                key={pos.id}
                className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-surface)] transition-colors"
              >
                <td className="py-2 pr-4 font-mono font-semibold text-[var(--color-text)]">
                  {pos.ticker}
                </td>
                <td className="py-2 pr-4 text-[var(--color-text-sub)]">{pos.name ?? '—'}</td>
                <td className="py-2 pr-4 text-[var(--color-text-sub)] capitalize">{pos.type}</td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">{pos.quantity}</td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">{formatEur(pos.pru)}</td>
                <td className="py-2 pr-4 text-right text-[var(--color-text)]">
                  {hasPrice ? formatEur(pos.priceEur!) : '—'}
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
