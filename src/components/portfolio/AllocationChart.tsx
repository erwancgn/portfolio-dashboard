'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { AllocationEntry } from './AllocationSection'
import { formatEur } from '@/lib/format'

interface Props {
  envelopeData: AllocationEntry[]
  sectorData: AllocationEntry[]
  weightData: AllocationEntry[]
  countryData: AllocationEntry[]
}

const PALETTE = ['#2563eb', '#0d9488', '#16a34a', '#7c3aed', '#d97706', '#db2777', '#64748b']

type Tab = 'envelope' | 'sector' | 'weight' | 'country'

const ALL_TABS: { key: Tab; label: string }[] = [
  { key: 'envelope', label: 'Enveloppe' },
  { key: 'sector',   label: 'Secteur' },
  { key: 'weight',   label: 'Poids' },
  { key: 'country',  label: 'Pays' },
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

/** Tooltip personnalisé utilisant les variables CSS du thème */
function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const entry = payload[0]
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-[var(--color-text)]">{entry.name}</p>
      <p className="tabular-nums text-[var(--color-text-sub)]">{formatEur(entry.value)}</p>
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
            <span className="text-[var(--color-text-sub)] truncate min-w-0 max-w-[8rem] sm:max-w-[12rem]">{entry.label}</span>
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
 * Affiche quatre vues (onglets) : Enveloppe, Secteur, Poids (par titre), Pays.
 * Utilise Recharts PieChart avec tooltip et légende personnalisés.
 */
export default function AllocationChart({ envelopeData, sectorData, weightData, countryData }: Props) {
  const [tab, setTab] = useState<Tab>('envelope')

  const dataMap: Record<Tab, AllocationEntry[]> = {
    envelope: envelopeData,
    sector:   sectorData,
    weight:   weightData,
    country:  countryData,
  }

  // N'afficher que les onglets qui ont des données
  const visibleTabs = ALL_TABS.filter(({ key }) => dataMap[key].length > 0)
  const activeData = dataMap[tab].length > 0 ? dataMap[tab] : envelopeData

  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Allocation</h2>
        {visibleTabs.length > 1 && (
          <div className="flex gap-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-0.5">
            {visibleTabs.map(({ key, label }) => (
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
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height={192}>
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
          <p className="text-xs text-[var(--color-text-dim)] mt-3">
            Basé sur la valeur actuelle (prix live ou quantité × PRU)
          </p>
        </div>
      </div>
    </section>
  )
}
