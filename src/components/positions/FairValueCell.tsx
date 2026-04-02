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
  const [showPopup, setShowPopup] = useState(false)

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

  /* Résultat : badge + prix + bouton "?" */
  return (
    <div className="flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SIGNAL_CLASSES[data.signal]}`}>
        {SIGNAL_LABELS[data.signal]}
      </span>

      <span className="text-xs tabular-nums text-[var(--color-text)]">
        Prix {fmtPrice(data.current_price)}
      </span>

      {data.fair_value !== null && (
        <span className="flex items-center gap-1">
          <span className="text-xs tabular-nums text-[var(--color-text)]">
            FV {fmtPrice(data.fair_value)}
          </span>
        </span>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); setShowPopup(true) }}
        title="Voir l'explication"
        className="w-4 h-4 rounded-full border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] hover:border-[var(--color-text-sub)] transition-colors text-[10px] font-bold leading-none flex items-center justify-center"
      >
        ?
      </button>

      {/* Popup explication */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setShowPopup(false) }}
        >
          <div
            className="glass-card relative w-full max-w-md rounded-[28px] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text-sub)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] transition-colors text-sm"
              aria-label="Fermer"
            >
              ✕
            </button>
            <h3 className="text-sm font-semibold text-[var(--color-text)] pr-6">
              Fair value — {ticker}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-sub)]">
              <span>Prix {fmtPrice(data.current_price)}</span>
              {data.fair_value !== null && <span>· FV {fmtPrice(data.fair_value)}</span>}
              <span>· {SIGNAL_LABELS[data.signal]}</span>
            </div>
            <p className="text-sm text-[var(--color-text-sub)] leading-relaxed">{data.analysis}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-sub)] pt-3 border-t border-[var(--color-border)]">
              <span>{data.methodology}</span>
              <span>·</span>
              <span>Confiance {data.confidence === 'high' ? 'élevée' : data.confidence === 'medium' ? 'moyenne' : 'faible'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
