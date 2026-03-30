'use client'

import { useState, useCallback } from 'react'
import AddBuyButton from './AddBuyButton'
import SellButton from './SellButton'
import DcaButton from './DcaButton'
import PositionDrawer from './PositionDrawer'
import type { PositionRow, DcaRuleMap } from './PositionsTable'
import { formatEur, formatPct } from '@/lib/format'
import TickerLogo from '@/components/ui/TickerLogo'

interface Props {
  rows: PositionRow[]
  dcaRules: DcaRuleMap
}

type SortKey = 'ticker' | 'type' | 'priceEur' | 'valeur' | 'pnl' | 'pnlPct' | 'poids'
type SortDir = 'asc' | 'desc'

/** Compare deux valeurs nullables — les nulls vont toujours en dernier */
function compareNullable(a: number | null, b: number | null, dir: SortDir): number {
  if (a === null && b === null) return 0
  if (a === null) return 1
  if (b === null) return -1
  return dir === 'asc' ? a - b : b - a
}

interface SortIconProps {
  col: SortKey
  activeKey: SortKey
  activeDir: SortDir
}

/** Icone de tri — affiche la direction si la colonne est active */
function SortIcon({ col, activeKey, activeDir }: SortIconProps) {
  if (activeKey !== col) return <span className="ml-1 opacity-30">↕</span>
  return <span className="ml-1">{activeDir === 'asc' ? '↑' : '↓'}</span>
}

interface ThProps {
  col: SortKey
  label: string
  right?: boolean
  activeKey: SortKey
  activeDir: SortDir
  onSort: (key: SortKey) => void
}

/** En-tête de colonne triable */
function Th({ col, label, right = false, activeKey, activeDir, onSort }: ThProps) {
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-3 py-3 text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide cursor-pointer select-none hover:text-[var(--color-text)] transition-colors ${right ? 'text-right' : 'text-left'}`}
    >
      {label}
      <SortIcon col={col} activeKey={activeKey} activeDir={activeDir} />
    </th>
  )
}

/**
 * PositionsTableView — Client Component.
 * Tableau 8 colonnes avec tri par colonne.
 * Clic sur une ligne → drawer de détails.
 */
export default function PositionsTableView({ rows, dcaRules }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('pnl')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [selected, setSelected] = useState<PositionRow | null>(null)

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return key
      }
      setSortDir('desc')
      return key
    })
  }, [])

  const sorted = [...rows].sort((a, b) => {
    switch (sortKey) {
      case 'ticker': {
        const cmp = a.ticker.localeCompare(b.ticker)
        return sortDir === 'asc' ? cmp : -cmp
      }
      case 'type': {
        const cmp = (a.type ?? '').localeCompare(b.type ?? '')
        return sortDir === 'asc' ? cmp : -cmp
      }
      case 'priceEur': return compareNullable(a.priceEur, b.priceEur, sortDir)
      case 'valeur':   return compareNullable(a.valeur, b.valeur, sortDir)
      case 'pnl':      return compareNullable(a.pnl, b.pnl, sortDir)
      case 'pnlPct':   return compareNullable(a.pnlPct, b.pnlPct, sortDir)
      case 'poids':    return compareNullable(a.poids, b.poids, sortDir)
      default:         return 0
    }
  })

  const thProps = { activeKey: sortKey, activeDir: sortDir, onSort: handleSort }

  return (
    <>
      <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
              <Th col="ticker"   label="Actif"     {...thProps} />
              <Th col="type"     label="Type"      {...thProps} />
              <Th col="priceEur" label="Prix"      right {...thProps} />
              <Th col="valeur"   label="Valeur €"  right {...thProps} />
              <Th col="pnl"      label="P&L €"     right {...thProps} />
              <Th col="pnlPct"   label="P&L %"     right {...thProps} />
              <Th col="poids"    label="Poids %"   right {...thProps} />
              <th className="px-3 py-3 text-right text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isGain = row.pnl !== null && row.pnl >= 0
              const pnlColor = row.pnl === null
                ? 'text-[var(--color-text-sub)]'
                : isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'

              return (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-surface)] cursor-pointer transition-colors"
                >
                  {/* Logo + Nom + Ticker */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <TickerLogo logoUrl={row.logo_url} ticker={row.ticker} size="sm" />
                      <div>
                        <p className="font-semibold text-[var(--color-text)] leading-tight">{row.ticker}</p>
                        {row.name && (
                          <p className="text-xs text-[var(--color-text-sub)] truncate max-w-[110px] leading-tight">
                            {row.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-3 py-3">
                    {row.type ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-sub)]">
                        {row.type}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-sub)]">—</span>
                    )}
                  </td>

                  {/* Prix */}
                  <td className="px-3 py-3 text-right tabular-nums text-[var(--color-text-sub)] text-xs">
                    {row.priceEur !== null ? formatEur(row.priceEur) : '—'}
                  </td>

                  {/* Valeur */}
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-[var(--color-text)]">
                    {row.valeur !== null ? formatEur(row.valeur) : '—'}
                  </td>

                  {/* P&L € */}
                  <td className={`px-3 py-3 text-right font-semibold tabular-nums ${pnlColor}`}>
                    {row.pnl !== null ? `${isGain ? '+' : ''}${formatEur(row.pnl)}` : '—'}
                  </td>

                  {/* P&L % */}
                  <td className="px-3 py-3 text-right">
                    {row.pnlPct !== null ? (
                      <span className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                        row.pnlPct >= 0
                          ? 'bg-[var(--color-green-bg)] text-[var(--color-green-text)]'
                          : 'bg-[var(--color-red-bg)] text-[var(--color-red-text)]'
                      }`}>
                        {formatPct(row.pnlPct)}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-sub)]">—</span>
                    )}
                  </td>

                  {/* Poids % */}
                  <td className="px-3 py-3 text-right text-[var(--color-text-sub)] tabular-nums text-xs">
                    {row.poids !== null ? `${row.poids.toFixed(1)} %` : '—'}
                  </td>

                  {/* Actions — stopPropagation pour ne pas ouvrir le drawer */}
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-1">
                      <AddBuyButton id={row.id} ticker={row.ticker} />
                      <SellButton
                        id={row.id}
                        ticker={row.ticker}
                        maxQuantity={row.quantity}
                        pru={row.pru}
                        envelope={row.envelope}
                      />
                      <DcaButton
                        positionId={row.id}
                        ticker={row.ticker}
                        hasActiveDca={dcaRules[row.id]?.is_active === true}
                        activeDcaId={dcaRules[row.id]?.id}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <PositionDrawer selected={selected} onClose={() => setSelected(null)} dcaRules={dcaRules} />
    </>
  )
}
