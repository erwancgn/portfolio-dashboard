'use client'

import { useState, useCallback } from 'react'
import AddBuyButton from './AddBuyButton'
import SellButton from './SellButton'
import DcaButton from './DcaButton'
import PositionDrawer from './PositionDrawer'
import type { PositionRow, DcaRuleMap } from './PositionsTable'
import { formatEur, formatPct, countryToFlag } from '@/lib/format'
import TickerLogo from '@/components/ui/TickerLogo'
import FairValueCell from './FairValueCell'

interface Props { rows: PositionRow[]; dcaRules: DcaRuleMap }

type SortKey = 'ticker' | 'type' | 'priceEur' | 'valeur' | 'pnl' | 'pnlPct' | 'poids'
type SortDir = 'asc' | 'desc'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'pnl', label: 'P&L €' }, { key: 'pnlPct', label: 'P&L %' },
  { key: 'valeur', label: 'Valeur' }, { key: 'poids', label: 'Poids' },
  { key: 'priceEur', label: 'Prix' }, { key: 'ticker', label: 'Ticker' },
]

function compareNullable(a: number | null, b: number | null, dir: SortDir): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return dir === 'asc' ? a - b : b - a
}

function MetricCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium text-[var(--color-text-sub)] uppercase tracking-wide whitespace-nowrap">{label}</span>
      <div className="text-sm tabular-nums text-[var(--color-text)]">{children}</div>
    </div>
  )
}

/**
 * PositionsTableView — Client Component.
 * Layout card inspiré Moning (flex) :
 * - Ligne 1a : nom + pays | badges investissement (desktop)
 * - Ligne 1b : actions (desktop hover-reveal, mobile permanent)
 * - Ligne 2  : métriques justify-between
 */
export default function PositionsTableView({ rows, dcaRules }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('pnl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<PositionRow | null>(null)

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return key }
      setSortDir('desc')
      return key
    })
  }, [])

  const sorted = [...rows].sort((a, b) => {
    switch (sortKey) {
      case 'ticker':  { const c = a.ticker.localeCompare(b.ticker); return sortDir === 'asc' ? c : -c }
      case 'type':    { const c = (a.type ?? '').localeCompare(b.type ?? ''); return sortDir === 'asc' ? c : -c }
      case 'priceEur': return compareNullable(a.priceEur, b.priceEur, sortDir)
      case 'valeur':   return compareNullable(a.valeur, b.valeur, sortDir)
      case 'pnl':      return compareNullable(a.pnl, b.pnl, sortDir)
      case 'pnlPct':   return compareNullable(a.pnlPct, b.pnlPct, sortDir)
      case 'poids':    return compareNullable(a.poids, b.poids, sortDir)
      default: return 0
    }
  })

  return (
    <>
      {/* Barre de tri */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-sub)]">Trier par</span>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => handleSort(opt.key)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${sortKey === opt.key
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white font-medium'
                : 'border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-sub)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'}`}>
              {opt.label}{sortKey === opt.key && <span className="ml-1 opacity-80">{sortDir === 'asc' ? '↑' : '↓'}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {sorted.map((row) => {
          const isGain = row.pnl !== null && row.pnl >= 0
          const pnlColor = row.pnl === null ? 'text-[var(--color-text-sub)]' : isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
          const montantInvesti = row.quantity != null && row.pru != null ? row.quantity * row.pru : null

          return (
            <div key={row.id} onClick={() => setSelected(row)}
              className="group flex rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-card)] cursor-pointer transition-all">

              {/* Logo — hauteur auto, centré verticalement */}
              <div className="flex shrink-0 items-center justify-center border-r border-[var(--color-border)] px-4">
                <TickerLogo logoUrl={row.logo_url} ticker={row.ticker} size="md" />
              </div>

              {/* Colonne droite */}
              <div className="flex-1 flex flex-col min-w-0">

                {/* ── 1a : nom + pays | badges investissement ── */}
                <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="font-semibold text-sm text-[var(--color-text)] leading-tight truncate">{row.name ?? row.ticker}</p>
                    {row.country && (
                      <span className="text-xs text-[var(--color-text-sub)] whitespace-nowrap shrink-0">
                        {countryToFlag(row.country)} {row.country}
                      </span>
                    )}
                  </div>
                  {/* Badges — desktop uniquement */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {montantInvesti !== null && row.pru !== null && row.quantity != null && (
                      <span className="text-xs text-[var(--color-text-sub)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-2 py-1 rounded-lg tabular-nums whitespace-nowrap">
                        {row.quantity % 1 === 0 ? row.quantity : row.quantity.toFixed(4)} × {formatEur(row.pru)}
                      </span>
                    )}
                    {montantInvesti !== null && (
                      <span className="text-sm font-semibold text-white bg-[var(--color-accent)] px-3 py-1 rounded-lg tabular-nums whitespace-nowrap">
                        {formatEur(montantInvesti)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── 1b desktop : actions révélées au hover ── */}
                <div className="hidden sm:group-hover:flex items-center gap-1.5 px-4 pb-3"
                  onClick={(e) => e.stopPropagation()}>
                  <AddBuyButton id={row.id} ticker={row.ticker} />
                  <SellButton id={row.id} ticker={row.ticker} maxQuantity={row.quantity} pru={row.pru} envelope={row.envelope} />
                  <DcaButton positionId={row.id} ticker={row.ticker} hasActiveDca={dcaRules[row.id]?.is_active === true} activeDcaId={dcaRules[row.id]?.id} />
                  <div className="h-4 w-px bg-[var(--color-border)]" />
                  <FairValueCell ticker={row.ticker} />
                </div>

                {/* ── Mobile : badges qty×PRU + montant ── */}
                <div className="sm:hidden flex flex-wrap items-center gap-2 px-4 pb-3">
                  {montantInvesti !== null && row.pru !== null && row.quantity != null && (
                    <span className="text-xs text-[var(--color-text-sub)] bg-[var(--color-bg-surface)] border border-[var(--color-border)] px-2 py-1 rounded-lg tabular-nums">
                      {row.quantity % 1 === 0 ? row.quantity : row.quantity.toFixed(4)} × {formatEur(row.pru)}
                    </span>
                  )}
                  {montantInvesti !== null && (
                    <span className="text-sm font-semibold text-white bg-[var(--color-accent)] px-3 py-1 rounded-lg tabular-nums">
                      {formatEur(montantInvesti)}
                    </span>
                  )}
                </div>

                {/* ── Ligne 2 : métriques ── */}
                <div className="overflow-hidden rounded-b-[24px] border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                  onClick={(e) => e.stopPropagation()}>

                  {/* Mobile : grille 2×2 */}
                  <div className="sm:hidden grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-4 cursor-pointer" onClick={() => setSelected(row)}>
                    <MetricCell label="Valeur"><span className="font-medium">{row.valeur !== null ? formatEur(row.valeur) : '—'}</span></MetricCell>
                    <MetricCell label="P&L €"><span className={`font-semibold ${pnlColor}`}>{row.pnl !== null ? `${isGain ? '+' : ''}${formatEur(row.pnl)}` : '—'}</span></MetricCell>
                    <MetricCell label="P&L %">
                      {row.pnlPct !== null
                        ? <span className={`text-sm font-medium px-1.5 py-0.5 rounded tabular-nums ${row.pnlPct >= 0 ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]' : 'bg-[var(--color-red-bg)] text-[var(--color-red-text)]'}`}>{formatPct(row.pnlPct)}</span>
                        : '—'}
                    </MetricCell>
                    <MetricCell label="Poids">{row.poids !== null ? `${row.poids.toFixed(1)} %` : '—'}</MetricCell>
                  </div>

                  {/* Mobile : actions */}
                  <div className="sm:hidden flex flex-wrap items-center gap-1.5 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                    <AddBuyButton id={row.id} ticker={row.ticker} />
                    <SellButton id={row.id} ticker={row.ticker} maxQuantity={row.quantity} pru={row.pru} envelope={row.envelope} />
                    <DcaButton positionId={row.id} ticker={row.ticker} hasActiveDca={dcaRules[row.id]?.is_active === true} activeDcaId={dcaRules[row.id]?.id} />
                    <FairValueCell ticker={row.ticker} />
                  </div>

                  {/* Desktop : métriques justify-between */}
                  <div className="hidden sm:flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setSelected(row)}>
                    <MetricCell label="Ticker"><span className="font-semibold">{row.ticker}</span></MetricCell>
                    <MetricCell label="Type">{row.type ?? <span className="text-[var(--color-text-sub)]">—</span>}</MetricCell>
                    <MetricCell label="Enveloppe">{row.envelope ?? <span className="text-[var(--color-text-sub)]">—</span>}</MetricCell>
                    <MetricCell label="Prix live">{row.priceEur !== null ? formatEur(row.priceEur) : <span className="text-[var(--color-text-sub)]">—</span>}</MetricCell>
                    <MetricCell label="Valeur"><span className="font-medium">{row.valeur !== null ? formatEur(row.valeur) : <span className="text-[var(--color-text-sub)]">—</span>}</span></MetricCell>
                    <MetricCell label="P&L €"><span className={`font-semibold ${pnlColor}`}>{row.pnl !== null ? `${isGain ? '+' : ''}${formatEur(row.pnl)}` : '—'}</span></MetricCell>
                    <MetricCell label="P&L %">
                      {row.pnlPct !== null
                        ? <span className={`text-sm font-medium px-1.5 py-0.5 rounded tabular-nums ${row.pnlPct >= 0 ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]' : 'bg-[var(--color-red-bg)] text-[var(--color-red-text)]'}`}>{formatPct(row.pnlPct)}</span>
                        : <span className="text-[var(--color-text-sub)]">—</span>}
                    </MetricCell>
                    <MetricCell label="Poids">{row.poids !== null ? `${row.poids.toFixed(1)} %` : <span className="text-[var(--color-text-sub)]">—</span>}</MetricCell>
                  </div>

                </div>
              </div>
            </div>
          )
        })}
      </div>

      <PositionDrawer selected={selected} onClose={() => setSelected(null)} dcaRules={dcaRules} />
    </>
  )
}
