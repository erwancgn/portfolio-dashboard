'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { AllocationEntry } from './AllocationSection'
import { formatEur } from '@/lib/format'

interface Props {
  envelopeData: AllocationEntry[]
  sectorData: AllocationEntry[]
}

const PALETTE = ['#2563eb', '#3b82f6', '#60a5fa', '#1d4ed8', '#93c5fd', '#1e40af', '#bfdbfe']

type Tab = 'envelope' | 'sector'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

/** Tooltip personnalisé utilisant les variables CSS du thème */
function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  const total = entry.value
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-[var(--color-text)]">{entry.name}</p>
      <p className="text-[var(--color-text-sub)]">{formatEur(total)}</p>
    </div>
  )
}

/** Légende personnalisée avec pastilles colorées */
function ChartLegend({ data }: { data: AllocationEntry[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <ul className="flex flex-col gap-1.5 mt-4">
      {data.map((entry, i) => (
        <li key={entry.label} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 10 10" className="flex-shrink-0">
              <circle cx="5" cy="5" r="5" fill={PALETTE[i % PALETTE.length]} />
            </svg>
            <span className="text-[var(--color-text-sub)] truncate max-w-32">{entry.label}</span>
          </span>
          <span className="text-[var(--color-text)] font-medium tabular-nums">
            {total > 0 ? `${((entry.value / total) * 100).toFixed(1)} %` : '—'}
          </span>
        </li>
      ))}
    </ul>
  )
}

/**
 * AllocationChart — Client Component.
 * Affiche deux vues (onglets) : répartition par enveloppe et par secteur.
 * Utilise Recharts PieChart avec tooltip et légende personnalisés.
 * Valeur investie = quantité × PRU (approximation sans conversion de devise).
 */
export default function AllocationChart({ envelopeData, sectorData }: Props) {
  const [tab, setTab] = useState<Tab>('envelope')

  const activeData = tab === 'envelope' ? envelopeData : sectorData
  const hasSector = sectorData.length > 0

  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Allocation</h2>
        <div className="flex gap-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-0.5">
          <button
            onClick={() => setTab('envelope')}
            className={`px-3 py-1 rounded-md transition-colors ${
              tab === 'envelope'
                ? 'bg-[var(--color-accent)] text-white font-medium'
                : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
            }`}
          >
            Enveloppe
          </button>
          {hasSector && (
            <button
              onClick={() => setTab('sector')}
              className={`px-3 py-1 rounded-md transition-colors ${
                tab === 'sector'
                  ? 'bg-[var(--color-accent)] text-white font-medium'
                  : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
              }`}
            >
              Secteur
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={activeData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {activeData.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full">
          <ChartLegend data={activeData} />
          <p className="text-[10px] text-[var(--color-text-sub)] mt-3">
            Basé sur la valeur investie (quantité × PRU)
          </p>
        </div>
      </div>
    </section>
  )
}
