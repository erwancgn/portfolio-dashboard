'use client'

import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Treemap,
} from 'recharts'
import type { HeatmapEntry, SnapshotEntry } from './PerformanceSection'
import { formatEur } from '@/lib/format'
import { PerformanceTile } from './PerformanceTile'

interface Props {
  snapshots: SnapshotEntry[]
  heatmapData: HeatmapEntry[]
}

type Tab = 'performance' | 'carte'
type Period = 'YTD' | '1M' | '3M' | '6M' | '1A' | 'Max'

const PERIODS: Period[] = ['YTD', '1M', '3M', '6M', '1A', 'Max']

/** Retourne la date ISO de coupure pour une période donnée */
function periodCutoff(period: Period): string | null {
  if (period === 'Max') return null
  if (period === 'YTD') return `${new Date().getFullYear()}-01-01`
  const days: Record<Exclude<Period, 'YTD' | 'Max'>, number> = { '1M': 30, '3M': 90, '6M': 180, '1A': 365 }
  const d = new Date()
  d.setDate(d.getDate() - days[period as keyof typeof days])
  return d.toISOString().slice(0, 10)
}

/** Formate une date ISO (YYYY-MM-DD) en DD/MM */
function fmtDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

interface LineTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

/** Tooltip personnalisé pour le LineChart */
function LineTooltip({ active, payload, label }: LineTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs shadow-md">
      <p className="text-[var(--color-text-sub)] mb-0.5">{label}</p>
      <p className="font-medium tabular-nums text-[var(--color-text)]">{formatEur(payload[0].value)}</p>
    </div>
  )
}

/**
 * PerformanceChart — Client Component.
 * Deux vues : courbe de la valeur du portfolio (LineChart) et heatmap Wall Street (Treemap).
 */
export default function PerformanceChart({ snapshots, heatmapData }: Props) {
  const [tab, setTab] = useState<Tab>('performance')
  const [period, setPeriod] = useState<Period>('1M')

  const cutoff = periodCutoff(period)
  const filteredSnapshots = cutoff ? snapshots.filter((s) => s.date >= cutoff) : snapshots

  const chartData = filteredSnapshots.map((s) => ({
    date: fmtDate(s.date),
    value: s.total_value,
  }))

  // Racine carrée pour compresser les gros actifs (ex: BTC) et rendre toutes les tuiles lisibles
  const treemapData = heatmapData.map((e) => ({
    name: e.ticker,
    size: Math.sqrt(Math.max(e.value, 1)),
    ticker: e.ticker,
    changePercent: e.changePercent,
  }))

  const tabs: { key: Tab; label: string }[] = [
    { key: 'performance', label: 'Performance' },
    { key: 'carte', label: 'Carte' },
  ]

  return (
    <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Performance</h2>
        <div className="flex gap-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-0.5">
          {tabs.map(({ key, label }) => (
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

      {/* Tab Performance */}
      {tab === 'performance' && (
        <div>
          {/* Sélecteur de période */}
          <div className="flex gap-1 mb-4">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  period === p
                    ? 'bg-[var(--color-accent)] text-white font-medium'
                    : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)] bg-[var(--color-bg-primary)]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {chartData.length < 2 ? (
            <div className="py-8 text-center">
              {snapshots.length === 1 && (
                <p className="text-2xl font-semibold tabular-nums text-[var(--color-text)] mb-1">
                  {formatEur(snapshots[0].total_value)}
                </p>
              )}
              <p className="text-sm text-[var(--color-text-sub)]">
                Historique en cours de constitution — revenez demain pour voir la courbe
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-sub)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-sub)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Tab Carte (heatmap) */}
      {tab === 'carte' && (
        <div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                content={<PerformanceTile />}
              />
            </ResponsiveContainer>
          </div>

          {/* Légende couleur */}
          <div className="flex items-center gap-2 mt-3 justify-center">
            <span className="text-xs text-[var(--color-text-sub)]">-5%</span>
            <div className="flex h-3 w-35 rounded overflow-hidden">
              <div className="flex-1 bg-[#7f1d1d]" />
              <div className="flex-1 bg-[#dc2626]" />
              <div className="flex-1 bg-[#f87171]" />
              <div className="flex-1 bg-[#475569]" />
              <div className="flex-1 bg-[#4ade80]" />
              <div className="flex-1 bg-[#16a34a]" />
              <div className="flex-1 bg-[#14532d]" />
            </div>
            <span className="text-xs text-[var(--color-text-sub)]">+5%</span>
          </div>
        </div>
      )}
    </section>
  )
}
