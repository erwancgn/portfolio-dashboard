/**
 * Formate un nombre en euros, 2 décimales.
 * Exemple : 1234.5 → "1 234,50 €"
 */
export function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

/**
 * Formate un pourcentage avec signe.
 * Exemple : 3.5 → "+3.50 %", -1.2 → "-1.20 %"
 */
export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}
