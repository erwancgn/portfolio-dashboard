'use client'

import { useState } from 'react'
import type { ClassicAnalysisResult } from '@/app/api/analyse/classic/route'
import { useAssetSearch } from './useAssetSearch'
import ClassicResultCard from './ClassicResultCard'

type Method = 'buffett' | 'lynch'

const TYPE_LABELS: Record<string, string> = { stock: 'Action', etf: 'ETF', crypto: 'Crypto' }

export type ClassicResult =
  | { ok: true; data: ClassicAnalysisResult }
  | { ok: false; quota: true; message: string }
  | { ok: false; quota?: false; message: string }

/**
 * ClassicAnalysis — Client Component.
 * Analyse d'un actif selon la méthode Buffett (value) ou Lynch (growth).
 * Appelle POST /api/analyse/classic — cache Supabase 7 jours.
 */
export default function ClassicAnalysis() {
  const [ticker, setTicker] = useState('')
  const [method, setMethod] = useState<Method>('buffett')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ClassicResult | null>(null)
  const {
    suggestions,
    showSuggestions,
    wrapperRef,
    setShowSuggestions,
    selectSuggestion,
  } = useAssetSearch(ticker)

  async function handleAnalyse() {
    const t = ticker.trim().toUpperCase()
    if (!t || loading) return
    setLoading(true)
    setResult(null)
    setShowSuggestions(false)
    try {
      const res = await fetch('/api/analyse/classic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: t, method }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error: string; code: string }
        if (res.status === 429) setResult({ ok: false, quota: true, message: err.error })
        else setResult({ ok: false, message: err.error ?? 'Erreur inconnue' })
        return
      }
      setResult({ ok: true, data: (await res.json()) as ClassicAnalysisResult })
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
          Lecture fondamentale
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">Analyse classique</h2>
        <p className="mt-1 text-sm text-[var(--color-text-sub)]">
          Évaluation fondamentale selon Buffett (value) ou Lynch (growth)
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        {/* Sélecteur de méthode */}
        <div className="flex w-fit gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1">
          {(['buffett', 'lynch'] as Method[]).map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                method === m
                  ? 'bg-[var(--color-accent)] text-white shadow-sm'
                  : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
              }`}
            >
              {m === 'buffett' ? 'Buffett' : 'Lynch'}
            </button>
          ))}
        </div>

        {/* Saisie ticker + suggestions */}
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
          Deux cadres mentaux complémentaires: Buffett pour la qualité/prix, Lynch pour la croissance/pricing relatif.
        </div>

        {/* Résultat */}
        {result !== null && <ClassicResultCard result={result} />}
      </div>
    </section>
  )
}
