'use client'

/** Couleur de fond d'une tuile heatmap selon la variation 24h */
export function heatColor(c: number): string {
  if (c <= -5) return '#7f1d1d'
  if (c <= -2) return '#dc2626'
  if (c <= -0.5) return '#f87171'
  if (c < 0.5) return '#475569'
  if (c < 2) return '#4ade80'
  if (c < 5) return '#16a34a'
  return '#14532d'
}

interface TileProps {
  x?: number
  y?: number
  width?: number
  height?: number
  ticker?: string
  changePercent?: number
}

/**
 * PerformanceTile — renderer SVG custom pour chaque cellule du Treemap Recharts.
 * Colore la tuile selon heatColor(changePercent) et affiche ticker + variation %.
 */
export function PerformanceTile({ x = 0, y = 0, width = 0, height = 0, ticker, changePercent = 0 }: TileProps) {
  if (width < 10 || height < 10) return null
  const bg = heatColor(changePercent)
  const sign = changePercent >= 0 ? '+' : ''
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: bg }} rx={4} />
      {height > 20 && width > 24 && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (height > 34 ? 7 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(11, width / 4)}
          fill="white"
          fontWeight={600}
        >
          {ticker}
        </text>
      )}
      {height > 34 && width > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(9, width / 5)}
          fill="rgba(255,255,255,0.85)"
        >
          {sign}{changePercent.toFixed(2)}%
        </text>
      )}
    </g>
  )
}
