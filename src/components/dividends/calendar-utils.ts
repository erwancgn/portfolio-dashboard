/**
 * Utilitaires de construction du calendrier de dividendes.
 * Transforme les données de l'API en événements groupés par mois.
 */
import type { DividendsApiResponse } from '@/app/api/dividends/route'
import { formatCurrency } from '@/lib/format'

export interface CalendarEvent {
  date: string
  ticker: string
  amountPerShare: number
  totalAmount: number
  currency: string | null
  isPast: boolean
}

/**
 * Construit la liste des événements calendrier (passés 12 mois + projetés 12 mois),
 * triés par date croissante, groupés par mois "YYYY-MM".
 *
 * @param data - Réponse de l'API dividendes
 */
export function buildCalendarEvents(
  data: DividendsApiResponse,
): Map<string, CalendarEvent[]> {
  const today = new Date().toISOString().slice(0, 10)

  const horizon = new Date()
  horizon.setFullYear(horizon.getFullYear() + 1)
  const horizonStr = horizon.toISOString().slice(0, 10)

  const past12 = new Date()
  past12.setFullYear(past12.getFullYear() - 1)
  const past12Str = past12.toISOString().slice(0, 10)

  const events: CalendarEvent[] = []

  for (const pos of data.positions) {
    for (const h of pos.history) {
      if (h.date >= past12Str && h.date <= today) {
        events.push({
          date: h.date,
          ticker: pos.ticker,
          amountPerShare: h.amount,
          totalAmount: h.total,
          currency: pos.currency,
          isPast: true,
        })
      }
    }
    for (const p of pos.projected) {
      if (p.date > today && p.date <= horizonStr) {
        events.push({
          date: p.date,
          ticker: pos.ticker,
          amountPerShare: p.amount,
          totalAmount: p.total,
          currency: pos.currency,
          isPast: false,
        })
      }
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date))

  const grouped = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const month = event.date.slice(0, 7)
    const existing = grouped.get(month) ?? []
    existing.push(event)
    grouped.set(month, existing)
  }

  return grouped
}

/** Formate "YYYY-MM" en "Mois AAAA" en français */
export function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function formatCalendarAmount(amount: number, currency: string | null): string {
  return formatCurrency(amount, currency)
}

export function formatMonthTotal(events: CalendarEvent[]): string {
  const totalsByCurrency = [...events.reduce((map, event) => {
    const currency = event.currency ?? 'UNKNOWN'
    map.set(currency, (map.get(currency) ?? 0) + event.totalAmount)
    return map
  }, new Map<string, number>()).entries()]

  return totalsByCurrency
    .map(([currency, total]) =>
      formatCalendarAmount(total, currency === 'UNKNOWN' ? null : currency),
    )
    .join(' · ')
}
