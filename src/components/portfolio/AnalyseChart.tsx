'use client'

import { useState } from 'react'
import { formatEur } from '@/lib/format'
import type { AnalyseRow } from './AnalyseSection'

interface Props {
  weightData: AnalyseRow[]
  sectorData: AnalyseRow[]
  countryData: AnalyseRow[]
}

type Tab = 'poids' | 'secteur' | 'pays'

const TABS: { key: Tab; label: string }[] = [
  { key: 'poids', label: 'Poids' },
  { key: 'secteur', label: 'Secteur' },
  { key: 'pays', label: 'Pays' },
]

interface RowListProps {
  rows: AnalyseRow[]
}

/** Liste de lignes avec barre de progression horizontale */
function RowList({ rows }: RowListProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-sub)] text-center py-6">
        Aucune donnée disponible
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span
              className="text-sm text-[var(--color-text)] truncate max-w-xs"
              title={row.label}
            >
              {row.label}
            </span>
            <div className="flex items-center gap-3 flex-shrink-0 tabular-nums">
              <span className="text-sm text-[var(--color-text-sub)]">
                {formatEur(row.value)}
              </span>
              <span className="text-sm font-medium text-[var(--color-text)] w-14 text-right">
                {row.pct.toFixed(1)}&nbsp;%
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-elevated)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: `${Math.min(row.pct, 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * AnalyseChart — Client Component.
 * Affiche trois vues via onglets : Poids (par titre), Secteur, Pays.
 * Chaque ligne contient un label, une barre de progression proportionnelle,
 * la valeur investie et le poids en pourcentage.
 */
export default function AnalyseChart({ weightData, sectorData, countryData }: Props) {
  const [tab, setTab] = useState<Tab>('poids')

  const activeData: AnalyseRow[] =
    tab === 'poids' ? weightData : tab === 'secteur' ? sectorData : countryData

  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Analyse</h2>
        <div className="flex gap-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-0.5">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1 rounded-md transition-colors ${
                tab === key
                  ? 'bg-[var(--color-accent)] text-white font-medium'
                  : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <RowList rows={activeData} />

      <p className="text-[10px] text-[var(--color-text-sub)] mt-4">
        Basé sur la valeur investie (quantité × PRU)
      </p>
    </section>
  )
}
