'use client'

import { useState } from 'react'
import type { FairValueResponse } from '@/app/api/analyse/fair-value/route'

interface Props {
  /** Ticker pré-rempli (depuis le drawer de position) */
  ticker?: string
}

type FairValueResult =
  | { ok: true; data: FairValueResponse }
  | { ok: false; quota: true; message: string }
  | { ok: false; quota?: false; message: string }

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

const CONFIDENCE_LABELS = { low: 'Faible', medium: 'Moyenne', high: 'Élevée' } as const

/**
 * Formate un nombre en devise (EUR) ou retourne '—'.
 */
function fmtPrice(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)
}

/**
 * Formate une date ISO en "il y a X heures" ou date lisible.
 */
function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return 'à l\'instant'
  if (hours < 24) return `il y a ${hours}h`
  return new Date(iso).toLocaleDateString('fr-FR')
}

/**
 * FairValue — Client Component.
 * Estime la fair value d'un actif via Gemini + Search Grounding.
 * Déclenché à la demande, cache 24h côté serveur.
 */
export default function FairValue({ ticker: initialTicker }: Props) {
  const [ticker, setTicker] = useState(initialTicker ?? '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FairValueResult | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  async function handleEstimate() {
    const t = ticker.trim().toUpperCase()
    if (!t || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/analyse/fair-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: t }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string; code: string }
        if (res.status === 429) {
          setResult({ ok: false, quota: true, message: err.error })
        } else {
          setResult({ ok: false, message: err.error ?? 'Erreur inconnue' })
        }
        return
      }
      setResult({ ok: true, data: (await res.json()) as FairValueResponse })
    } catch {
      setResult({ ok: false, message: 'Impossible de contacter le serveur.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Saisie ticker (masqué si ticker pré-rempli depuis drawer) */}
      {!initialTicker && (
        <div className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleEstimate() }}
            disabled={loading}
            placeholder="Ex : AAPL, MSFT, CW8.PA…"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={() => void handleEstimate()}
            disabled={loading || ticker.trim() === ''}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Calcul…' : 'Estimer'}
          </button>
        </div>
      )}

      {/* Bouton si ticker pré-rempli */}
      {initialTicker && !result && (
        <button
          onClick={() => void handleEstimate()}
          disabled={loading}
          className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-sub)] text-sm hover:bg-[var(--color-bg-surface)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Calcul en cours…' : 'Calculer la fair value'}
        </button>
      )}

      {/* Résultat */}
      {result !== null && (
        <div className="space-y-3">
          {result.ok ? (
            <>
              {/* Header : badge signal + fair value + "?" + cache */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${SIGNAL_CLASSES[result.data.signal]}`}>
                  {SIGNAL_LABELS[result.data.signal]}
                </span>
                {result.data.fair_value !== null && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                      {fmtPrice(result.data.fair_value)}
                    </span>
                    <button
                      onClick={() => setShowExplanation(true)}
                      title="Voir l'explication"
                      className="w-4 h-4 rounded-full border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] hover:border-[var(--color-text-sub)] transition-colors text-[10px] font-bold leading-none flex items-center justify-center"
                    >
                      ?
                    </button>
                  </span>
                )}
                {result.data.from_cache && (
                  <span className="text-xs text-[var(--color-text-sub)] ml-auto">
                    Mis à jour {fmtAge(result.data.computed_at)}
                  </span>
                )}
              </div>

              {/* Prix actuel vs upside */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs text-[var(--color-text-sub)] mb-0.5">Prix actuel</p>
                  <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                    {fmtPrice(result.data.current_price)}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--color-bg-surface)] px-3 py-2">
                  <p className="text-xs text-[var(--color-text-sub)] mb-0.5">Upside</p>
                  <p className={`text-sm font-semibold tabular-nums ${result.data.fair_value !== null ? (result.data.upside_percent >= 0 ? 'text-green-400' : 'text-red-400') : 'text-[var(--color-text)]'}`}>
                    {result.data.fair_value !== null
                      ? `${result.data.upside_percent >= 0 ? '+' : ''}${result.data.upside_percent.toFixed(1)} %`
                      : '—'}
                  </p>
                </div>
              </div>

              {/* Bouton recalculer si ticker pré-rempli */}
              {initialTicker && (
                <button
                  onClick={() => void handleEstimate()}
                  disabled={loading}
                  className="text-xs text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors disabled:opacity-40"
                >
                  Recalculer
                </button>
              )}

              {/* Popup explication — fond semi-transparent + carte centrée */}
              {showExplanation && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                  onClick={() => setShowExplanation(false)}
                >
                  <div
                    className="relative w-full max-w-md rounded-xl border border-gray-300 bg-white p-5 shadow-2xl space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowExplanation(false)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                      aria-label="Fermer"
                    >
                      ✕
                    </button>

                    <h3 className="text-sm font-semibold text-gray-900 pr-6">
                      Analyse — {result.data.ticker}
                    </h3>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {result.data.analysis}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                      <span>Méthode : {result.data.methodology}</span>
                      <span>·</span>
                      <span>Confiance : {CONFIDENCE_LABELS[result.data.confidence]}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : result.quota ? (
            <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {result.message}
            </p>
          ) : (
            <p className="text-sm text-red-400">{result.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
