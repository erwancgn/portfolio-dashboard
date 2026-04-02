'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAssetSearch } from './useAssetSearch'

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
  BUY:  'bg-green-500/15 text-green-400 border border-green-500/30',
  SELL: 'bg-red-500/15 text-red-400 border border-red-500/30',
  HOLD: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-sub)] border border-[var(--color-border)]',
}

const SIGNAL_LABELS: Record<Signal, string> = {
  BUY: 'ACHETER', SELL: 'VENDRE', HOLD: 'CONSERVER',
}

/** Badge type actif */
const TYPE_LABELS: Record<string, string> = {
  stock: 'Action', etf: 'ETF', crypto: 'Crypto',
}

/**
 * QuickAnalysis — Client Component.
 * Analyse IA d'un actif via Gemini + Search Grounding.
 * Inclut l'autocomplétion de la recherche via /api/search.
 */
export default function QuickAnalysis() {
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyseResult | null>(null)
  const {
    suggestions,
    showSuggestions,
    wrapperRef,
    setShowSuggestions,
    selectSuggestion,
  } = useAssetSearch(ticker)

  async function handleAnalyse() {
    const trimmed = ticker.trim().toUpperCase()
    if (!trimmed || loading) return
    setLoading(true)
    setResult(null)
    setShowSuggestions(false)
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
      setResult({ ok: true, data: (await res.json()) as AnalyseResponse })
    } catch {
      setResult({ ok: false, message: 'Impossible de contacter le serveur.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card overflow-hidden rounded-[28px]">
      <div className="border-b border-[var(--color-border)] px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
          Screening express
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">Analyse rapide</h2>
        <p className="mt-1 text-sm text-[var(--color-text-sub)]">
          Entrez un ticker ou un nom pour obtenir une analyse IA instantanée
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* Zone de saisie + suggestions */}
        <div ref={wrapperRef} className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={ticker}
              onChange={(e) => { setTicker(e.target.value.toUpperCase()); setShowSuggestions(true) }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAnalyse() }}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              disabled={loading}
              placeholder="Ex : AAPL, MSFT, BTC-USD, Nvidia…"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-sub)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] disabled:opacity-50"
            />

            {/* Dropdown suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl">
                {suggestions.map((s) => (
                  <li
                    key={s.ticker}
                    onMouseDown={() => setTicker(selectSuggestion(s))}
                    className="flex cursor-pointer items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-3 transition-colors hover:bg-[var(--color-bg-secondary)] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">{s.name}</p>
                      <p className="text-xs text-[var(--color-text-sub)] font-mono">{s.ticker}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-bg-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-sub)]">
                      {TYPE_LABELS[s.type] ?? s.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => void handleAnalyse()}
            disabled={loading || ticker.trim() === ''}
            className="whitespace-nowrap rounded-2xl bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Analyse…' : 'Analyser'}
          </button>
        </div>

        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-sub)]">
          Vue conçue pour un tri rapide: signal, score, métriques clés, consensus et un verdict immédiatement exploitable.
        </div>

        {/* Résultat */}
        {result !== null && (
          <div className="space-y-4">
            {result.ok ? (
              <>
                {/* Badge signal + ticker + score */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${SIGNAL_CLASSES[result.data.signal]}`}>
                    {SIGNAL_LABELS[result.data.signal]}
                  </span>
                  <span className="font-mono text-sm font-semibold text-[var(--color-text)]">
                    {result.data.ticker}
                  </span>
                  <span className="rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-1 text-xs text-[var(--color-text-sub)]">
                    Score : {result.data.score}/100
                  </span>
                </div>

                {/* Analyse markdown */}
                <div className="
                  text-sm text-[var(--color-text)] leading-relaxed space-y-3
                  [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--color-text)] [&_h2]:mt-5 [&_h2]:mb-2
                  [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[var(--color-text)] [&_h3]:mt-4 [&_h3]:mb-1
                  [&_hr]:border-[var(--color-border)] [&_hr]:my-4
                  [&_strong]:font-semibold [&_strong]:text-[var(--color-text)]
                  [&_p]:leading-relaxed [&_p]:text-[var(--color-text)]
                  [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:text-[var(--color-text)]
                  [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs [&_table]:my-2
                  [&_th]:text-left [&_th]:py-1.5 [&_th]:px-2 [&_th]:border [&_th]:border-[var(--color-border)] [&_th]:bg-[var(--color-bg-surface)] [&_th]:font-semibold
                  [&_td]:py-1.5 [&_td]:px-2 [&_td]:border [&_td]:border-[var(--color-border)]
                  [&_tr:hover_td]:bg-[var(--color-bg-surface)]
                ">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result.data.analysis}
                  </ReactMarkdown>
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
