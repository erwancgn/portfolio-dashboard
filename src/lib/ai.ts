interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

const MESSAGE_CHAR_LIMIT = 500
const HISTORY_CHAR_BUDGET = 2400
const MODEL_ANALYSIS_CHAR_LIMIT = 9000

export interface PortfolioContextPosition {
  ticker: string
  name?: string | null
  quantity: number
  pru: number
  sector?: string | null
  envelope?: string | null
  current_price?: number | null
}

export function normalizeModelText(value: string, maxLength: number): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function compactHistory(
  history: HistoryMessage[],
  maxMessages = 8,
): HistoryMessage[] {
  const recent = history.slice(-maxMessages)
  const compacted = recent.map((message) => ({
    role: message.role,
    content: normalizeModelText(message.content, MESSAGE_CHAR_LIMIT),
  }))

  let total = 0
  const kept: HistoryMessage[] = []

  for (const message of compacted.toReversed()) {
    total += message.content.length
    if (total > HISTORY_CHAR_BUDGET) break
    kept.push(message)
  }

  return kept.toReversed()
}

export function extractLastJsonObject(raw: string): string | null {
  const matches = [...raw.matchAll(/\{[\s\S]*?\}/g)]
  return matches.length > 0 ? matches[matches.length - 1][0] : null
}

export function sanitizeModelAnalysis(raw: string): string {
  return raw.replace(/\n{3,}/g, '\n\n').trim().slice(0, MODEL_ANALYSIS_CHAR_LIMIT)
}

export function formatPortfolioContext(
  positions: PortfolioContextPosition[],
): string {
  if (positions.length === 0) {
    return "Tu es un assistant financier expert. L'utilisateur n'a pas encore de positions dans son portfolio. Réponds en français."
  }

  const enriched = positions.map((pos) => {
    const invested = pos.quantity * pos.pru
    const current = pos.current_price ? pos.quantity * pos.current_price : invested
    const pnl = current - invested
    const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0

    return {
      ticker: pos.ticker,
      name: pos.name ?? null,
      sector: pos.sector ?? 'N/A',
      envelope: pos.envelope ?? 'N/A',
      invested,
      current,
      pnl,
      pnlPct,
    }
  })

  const totalInvested = enriched.reduce((sum, pos) => sum + pos.invested, 0)
  const totalCurrent = enriched.reduce((sum, pos) => sum + pos.current, 0)
  const totalPnl = totalCurrent - totalInvested

  const topPositions = enriched
    .toSorted((a, b) => b.current - a.current)
    .slice(0, 8)
    .map((pos) => {
      const weight = totalCurrent > 0 ? (pos.current / totalCurrent) * 100 : 0
      const label = pos.name ? `${pos.ticker} (${pos.name})` : pos.ticker
      return `- ${label}: poids ${weight.toFixed(1)}%, P&L ${pos.pnl >= 0 ? '+' : ''}${pos.pnlPct.toFixed(1)}%, secteur ${pos.sector}, enveloppe ${pos.envelope}`
    })

  const sectorExposure = Array.from(
    enriched.reduce((map, pos) => {
      map.set(pos.sector, (map.get(pos.sector) ?? 0) + pos.current)
      return map
    }, new Map<string, number>()),
  )
    .toSorted((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sector, current]) => {
      const weight = totalCurrent > 0 ? (current / totalCurrent) * 100 : 0
      return `${sector}: ${weight.toFixed(1)}%`
    })
    .join(' | ')

  return `Tu es un assistant financier expert, spécialisé dans l'analyse de portefeuilles d'investissement personnels.
Contexte portfolio :
- ${enriched.length} positions
- Valeur investie: ${totalInvested.toFixed(0)} EUR
- Valeur actuelle: ${totalCurrent.toFixed(0)} EUR
- Performance totale: ${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)} EUR
- Exposition sectorielle principale: ${sectorExposure || 'N/A'}

Principales lignes :
${topPositions.join('\n')}

Réponds toujours en français. Sois concis, précis et orienté décision. N'invente aucun chiffre absent. Ne donne pas de conseil d'investissement formel.`
}
