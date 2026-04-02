'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClassicAnalysisResult } from '@/app/api/analyse/classic/route'
import { useAssetSearch } from './useAssetSearch'

type Method = 'buffett' | 'lynch'

type ClassicResult =
  | { ok: true; data: ClassicAnalysisResult }
  | { ok: false; quota: true; message: string }
  | { ok: false; quota?: false; message: string }

const SIGNAL_CLASSES = {
  BUY:  'bg-green-500/15 text-green-400 border border-green-500/30',
  SELL: 'bg-red-500/15 text-red-400 border border-red-500/30',
  HOLD: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-sub)] border border-[var(--color-border)]',
} as const

const SIGNAL_LABELS = { BUY: 'ACHETER', SELL: 'VENDRE', HOLD: 'CONSERVER' } as const

const MOAT_CLASSES = {
  wide:   'bg-green-500/15 text-green-400',
  narrow: 'bg-amber-500/15 text-amber-400',
  none:   'bg-red-500/15 text-red-400',
} as const

const MOAT_LABELS = { wide: 'Moat large', narrow: 'Moat étroit', none: 'Pas de moat' } as const

const TYPE_LABELS: Record<string, string> = { stock: 'Action', etf: 'ETF', crypto: 'Crypto' }

/** Formate l'âge d'un cache ISO → "il y a Xh" ou date */
function fmtAge(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hours < 1) return 'à l\'instant'
  if (hours < 24) return `il y a ${hours}h`
  return new Date(iso).toLocaleDateString('fr-FR')
}

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
        {result !== null && (
          <div className="space-y-4">
            {result.ok ? (
              <>
                {/* Badges : signal + ticker + score + cache */}
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${SIGNAL_CLASSES[result.data.signal]}`}>
                    {SIGNAL_LABELS[result.data.signal]}
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-text)] font-mono">{result.data.ticker}</span>
                  <span className="text-xs text-[var(--color-text-sub)]">Score : {result.data.score}/100</span>
                  {result.data.from_cache && (
                    <span className="text-xs text-[var(--color-text-sub)] ml-auto">Mis à jour {fmtAge(result.data.computed_at)}</span>
                  )}
                </div>

                {/* Métadonnées Buffett */}
                {result.data.method === 'buffett' && (result.data.moat || result.data.margin_of_safety !== undefined) && (
                  <div className="flex gap-2 flex-wrap">
                    {result.data.moat && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${MOAT_CLASSES[result.data.moat]}`}>
                        {MOAT_LABELS[result.data.moat]}
                      </span>
                    )}
                    {result.data.margin_of_safety !== undefined && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${result.data.margin_of_safety >= 0 ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                        Marge de sécurité : {result.data.margin_of_safety >= 0 ? '+' : ''}{result.data.margin_of_safety}%
                      </span>
                    )}
                  </div>
                )}

                {/* Métadonnées Lynch */}
                {result.data.method === 'lynch' && (
                  <div className="flex gap-2 flex-wrap">
                    {result.data.category && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-sub)] font-medium capitalize">
                        {result.data.category.replace('_', ' ')}
                      </span>
                    )}
                    {result.data.peg !== null && result.data.peg !== undefined && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${result.data.peg < 1 ? 'bg-green-500/15 text-green-400' : result.data.peg < 1.5 ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                        PEG : {result.data.peg.toFixed(2)}
                      </span>
                    )}
                    {result.data.story && (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${result.data.story === 'strong' ? 'bg-green-500/15 text-green-400' : result.data.story === 'moderate' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                        Story {result.data.story === 'strong' ? 'forte' : result.data.story === 'moderate' ? 'modérée' : 'faible'}
                      </span>
                    )}
                  </div>
                )}

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
