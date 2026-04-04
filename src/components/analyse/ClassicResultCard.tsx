'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ClassicResult } from './ClassicAnalysis'

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

/** Formate l'âge d'un cache ISO → "il y a Xh" ou date */
function fmtAge(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hours < 1) return 'à l\'instant'
  if (hours < 24) return `il y a ${hours}h`
  return new Date(iso).toLocaleDateString('fr-FR')
}

/**
 * ClassicResultCard — affiche le résultat d'une analyse Buffett ou Lynch.
 * @param result - Résultat de l'analyse (succès, quota ou erreur)
 */
export default function ClassicResultCard({ result }: { result: ClassicResult }) {
  if (!result.ok) {
    return result.quota ? (
      <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        {result.message}
      </p>
    ) : (
      <p className="text-sm text-red-400">{result.message}</p>
    )
  }

  return (
    <div className="space-y-4">
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
    </div>
  )
}

