/**
 * Helpers de traitement des dividendes FMP.
 * Détection de fréquence, calcul annuel, projection sur 12 mois.
 */

import type { DividendEntry, DividendFrequency } from './fmp-dividends'

/**
 * Détecte la fréquence de versement à partir des entrées historiques.
 * Analyse l'écart moyen entre les dernières dates de dividendes.
 *
 * @param entries - Historique trié par date décroissante
 */
export function detectFrequency(entries: DividendEntry[]): DividendFrequency {
  if (entries.length < 2) return 'unknown'

  const recent = entries.slice(0, 8)
  const gaps: number[] = []

  for (let i = 0; i < recent.length - 1; i++) {
    const d1 = new Date(recent[i].date).getTime()
    const d2 = new Date(recent[i + 1].date).getTime()
    const daysDiff = (d1 - d2) / (1000 * 60 * 60 * 24)
    gaps.push(daysDiff)
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length

  if (avgGap < 45) return 'monthly'
  if (avgGap < 110) return 'quarterly'
  if (avgGap < 280) return 'semi-annual'
  return 'annual'
}

/** Nombre de versements par an selon la fréquence */
export const PERIODS_PER_YEAR: Record<DividendFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  'semi-annual': 2,
  annual: 1,
  unknown: 1,
}

/**
 * Calcule le dividende annuel estimé par action à partir de l'historique récent.
 *
 * @param entries - Historique trié par date décroissante
 * @param frequency - Fréquence détectée
 */
export function calcAnnualDividendPerShare(
  entries: DividendEntry[],
  frequency: DividendFrequency,
): number {
  if (entries.length === 0) return 0

  const n = PERIODS_PER_YEAR[frequency]
  const recent = entries.slice(0, n)
  const avg = recent.reduce((sum, e) => sum + e.amount, 0) / recent.length

  return avg * n
}

/** Intervalle en jours entre chaque versement selon la fréquence */
const INTERVAL_DAYS: Record<DividendFrequency, number> = {
  monthly: 30,
  quarterly: 91,
  'semi-annual': 182,
  annual: 365,
  unknown: 365,
}

/**
 * Projette les prochains versements sur 12 mois glissants
 * à partir du dernier dividende connu et de la fréquence détectée.
 *
 * @param lastEntry - Dernier dividende versé
 * @param frequency - Fréquence de versement
 * @param amount - Montant estimé par versement
 */
export function projectDividends(
  lastEntry: DividendEntry,
  frequency: DividendFrequency,
  amount: number,
): DividendEntry[] {
  if (frequency === 'unknown' || amount === 0) return []

  const interval = INTERVAL_DAYS[frequency]
  const now = new Date()
  const horizon = new Date(now)
  horizon.setFullYear(horizon.getFullYear() + 1)

  const projected: DividendEntry[] = []
  let nextDate = new Date(lastEntry.date)

  while (nextDate <= now) {
    nextDate = new Date(nextDate.getTime() + interval * 24 * 60 * 60 * 1000)
  }

  while (nextDate <= horizon) {
    projected.push({
      date: nextDate.toISOString().slice(0, 10),
      amount,
      recordDate: null,
      paymentDate: null,
      declarationDate: null,
    })
    nextDate = new Date(nextDate.getTime() + interval * 24 * 60 * 60 * 1000)
  }

  return projected
}
