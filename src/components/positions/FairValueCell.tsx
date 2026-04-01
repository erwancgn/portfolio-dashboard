'use client'

import { useState } from 'react'
import type { FairValueResponse } from '@/app/api/analyse/fair-value/route'

interface Props {
  ticker: string
}

const SIGNAL_LABELS = {
  undervalued: 'Sous-évalué',
  fair: 'Juste prix',
  overvalued: 'Surévalué',
} as const

const SIGNAL_CLASSES = {
  undervalued: 'bg-green-500/15 text-green-400 border border-green-500/30',
  fair: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-sub)] border border-[var(--color-border)]',
  overvalued: 'bg-red-500/15 text-red-400 border border-red-500/30',
} as const

/** Formate un prix en EUR ou retourne '—' */
function fmtPrice(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

/**
 * FairValueCell — bouton inline par ligne du tableau des positions.
 * - Avant calcul : bouton "Fair value"
 * - Après calcul : badge signal + prix juste (tooltip hover = analyse narrative)
 */
export default function FairValueCell({ ticker }: Props) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FairValueResponse | null>(null)
  const [error, setError] = useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading || data) return
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/analyse/fair-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      if (!res.ok) { setError(true); return }
      setData((await res.json()) as FairValueResponse)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  /* Bouton initial */
  if (!data) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs px-2 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-sub)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        {loading ? '…' : error ? '⚠' : 'Fair value'}
      </button>
    )
  }

  /* Résultat : badge + prix avec tooltip analyse */
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SIGNAL_CLASSES[data.signal]}`}>
        {SIGNAL_LABELS[data.signal]}
      </span>

      {data.fair_value !== null && (
        <div className="relative group">
          <span className="text-xs tabular-nums text-[var(--color-text)] cursor-default underline decoration-dashed decoration-[var(--color-border)] underline-offset-2">
            {fmtPrice(data.fair_value)}
          </span>

          {/* Tooltip hover — analyse narrative */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-normal">
            <p className="text-xs text-[var(--color-text)] leading-relaxed">{data.analysis}</p>
            <p className="mt-2 text-[10px] text-[var(--color-text-sub)]">
              {data.methodology} · Confiance {data.confidence === 'high' ? 'élevée' : data.confidence === 'medium' ? 'moyenne' : 'faible'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
