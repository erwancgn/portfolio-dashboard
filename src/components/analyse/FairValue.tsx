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
            className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
          />
          <button
            onClick={() => void handleEstimate()}
            disabled={loading || ticker.trim() === ''}
            className="whitespace-nowrap rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
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
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-sub)] transition-colors hover:bg-[var(--color-bg-surface)] disabled:cursor-not-allowed disabled:opacity-40"
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
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${SIGNAL_CLASSES[result.data.signal]}`}>
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
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border)] text-[10px] font-bold leading-none text-[var(--color-text-sub)] transition-colors hover:border-[var(--color-text-sub)] hover:text-[var(--color-text)]"
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
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
                  <p className="text-xs text-[var(--color-text-sub)] mb-0.5">Prix actuel</p>
                  <p className="text-sm font-semibold tabular-nums text-[var(--color-text)]">
                    {fmtPrice(result.data.current_price)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
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
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                  onClick={() => setShowExplanation(false)}
                >
                  <div
                    className="glass-card relative w-full max-w-md space-y-4 rounded-[28px] p-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setShowExplanation(false)}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-sm text-[var(--color-text-sub)] transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]"
                      aria-label="Fermer"
                    >
                      ✕
                    </button>

                    <h3 className="pr-6 text-sm font-semibold text-[var(--color-text)]">
                      Analyse — {result.data.ticker}
                    </h3>

                    <p className="text-sm leading-relaxed text-[var(--color-text-sub)]">
                      {result.data.analysis}
                    </p>

                    <div className="flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-sub)]">
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
