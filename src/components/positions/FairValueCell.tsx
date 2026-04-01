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
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${SIGNAL_CLASSES[data.signal]}`}>
        {SIGNAL_LABELS[data.signal]}
      </span>

      {data.fair_value !== null && (
        <span className="flex items-center gap-1">
          <span className="text-xs tabular-nums text-[var(--color-text)]">
            {fmtPrice(data.fair_value)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowPopup(true) }}
            title="Voir l'explication"
            className="w-4 h-4 rounded-full border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] hover:border-[var(--color-text-sub)] transition-colors text-[10px] font-bold leading-none flex items-center justify-center"
          >
            ?
          </button>
        </span>
      )}

      {/* Popup explication */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { e.stopPropagation(); setShowPopup(false) }}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-gray-300 bg-white p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-sm"
              aria-label="Fermer"
            >
              ✕
            </button>
            <h3 className="text-sm font-semibold text-gray-900 pr-6">
              Fair value — {ticker}
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{data.analysis}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
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
