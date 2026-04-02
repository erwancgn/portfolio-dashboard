/**
 * Formate un nombre en euros, 2 décimales.
 * Exemple : 1234.5 → "1 234,50 €"
 */
export function formatEur(value: number): string {
  return formatCurrency(value, 'EUR')
}

/**
 * Formate un nombre dans sa devise native si elle est connue.
 * Retombe sur un format nombre + code devise si Intl ne supporte pas le code.
 */
export function formatCurrency(value: number, currency: string | null | undefined): string {
  if (!currency) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  } catch {
    return `${new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)} ${currency}`
  }
}

/**
 * Formate un pourcentage avec signe.
 * Exemple : 3.5 → "+3.50 %", -1.2 → "-1.20 %"
 */
export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`
}

/**
 * Convertit un code pays ISO 3166-1 alpha-2 en emoji drapeau.
 * Exemple : "US" → "🇺🇸", "FR" → "🇫🇷"
 * Retourne une chaîne vide si le code est invalide ou absent.
 */
export function countryToFlag(country: string | null | undefined): string {
  if (!country || country.length !== 2) return ''
  const codePoints = [...country.toUpperCase()].map(
    (char) => 0x1f1e6 + char.charCodeAt(0) - 65,
  )
  return String.fromCodePoint(...codePoints)
}
