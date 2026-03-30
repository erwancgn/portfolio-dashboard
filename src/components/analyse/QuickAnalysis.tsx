'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

/** Signal retourné par l'API */
type Signal = 'BUY' | 'HOLD' | 'SELL'

/** Réponse de POST /api/analyse/ticker */
interface AnalyseResponse {
  signal: Signal
  score: number
  analysis: string
  ticker: string
}

/** Réponse d'erreur de l'API */
interface ErrorResponse {
  error: string
  code: string
}

/** Résultat d'une analyse : succès, quota dépassé ou erreur */
type AnalyseResult =
  | { ok: true; data: AnalyseResponse }
  | { ok: false; quota: true; message: string }
  | { ok: false; quota?: false; message: string }

/** Classes Tailwind par signal */
const SIGNAL_CLASSES: Record<Signal, string> = {
  BUY: 'bg-green-500/15 text-green-400 border border-green-500/30',
  SELL: 'bg-red-500/15 text-red-400 border border-red-500/30',
  HOLD: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-sub)] border border-[var(--color-border)]',
}

/** Libellés français par signal */
const SIGNAL_LABELS: Record<Signal, string> = {
  BUY: 'ACHETER',
  SELL: 'VENDRE',
  HOLD: 'CONSERVER',
}

/**
 * QuickAnalysis — Client Component.
 * Permet d'analyser un titre boursier via l'agent IA Claude.
 * Appelle POST /api/analyse/ticker et affiche le signal + résumé.
 */
export default function QuickAnalysis() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)

  async function handleAnalyse() {
    const trimmed = ticker.trim().toUpperCase()
    if (!trimmed || loading) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/analyse/ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: trimmed }),
      })

      if (!res.ok) {
        const err = (await res.json()) as ErrorResponse
        if (res.status === 429 && err.code === 'QUOTA_EXCEEDED') {
          setResult({ ok: false, quota: true, message: err.error })
        } else {
          setResult({ ok: false, message: err.error ?? 'Erreur inconnue' })
        }
        return
      }

      const data = (await res.json()) as AnalyseResponse
      setResult({ ok: true, data })
    } catch {
      setResult({ ok: false, message: 'Impossible de contacter le serveur.' })
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void handleAnalyse()
    }
  }

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          Analyse rapide
        </h2>
        <p className="text-xs text-[var(--color-text-sub)] mt-0.5">
          Entrez un ticker pour obtenir une analyse IA instantanée
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Zone de saisie */}
        <div className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ex : AAPL, MC.PA, BTC-USD"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50 uppercase"
          />
          <button
            onClick={() => void handleAnalyse()}
            disabled={loading || ticker.trim() === ''}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? 'Analyse…' : 'Analyser'}
          </button>
        </div>

        {/* Résultat */}
        {result !== null && (
          <div className="space-y-3">
            {result.ok ? (
              <>
                {/* Badge signal + ticker + score */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${SIGNAL_CLASSES[result.data.signal]}`}
                  >
                    {SIGNAL_LABELS[result.data.signal]}
                  </span>
                  <span className="text-sm text-[var(--color-text-sub)] font-mono">
                    {result.data.ticker}
                  </span>
                  <span className="text-xs text-[var(--color-text-sub)]">
                    Score : {result.data.score}/100
                  </span>
                </div>

                {/* Analyse markdown structurée */}
                <div className="prose prose-sm prose-invert max-w-none text-[var(--color-text)] leading-relaxed [&_table]:w-full [&_table]:text-xs [&_th]:text-left [&_th]:py-1 [&_td]:py-1 [&_hr]:border-[var(--color-border)]">
                  <ReactMarkdown>{result.data.analysis}</ReactMarkdown>
                </div>
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
    </section>
  )
}
