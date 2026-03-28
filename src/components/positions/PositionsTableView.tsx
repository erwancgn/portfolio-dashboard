'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import AddBuyButton from './AddBuyButton'
import SellButton from './SellButton'
import type { PositionRow } from './PositionsTable'
import { formatEur, formatPct } from '@/lib/format'

interface Props {
  rows: PositionRow[]
}

/**
 * PositionsTableView — Client Component.
 * Affiche le tableau 5 colonnes. Clic sur une ligne → Sheet avec détails complets.
 */
export default function PositionsTableView({ rows }: Props) {
  const [selected, setSelected] = useState<PositionRow | null>(null)

  return (
    <>
      <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">Actif</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">Valeur</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">P&amp;L</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">Poids</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-sub)] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
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
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--color-text)]">{row.ticker}</p>
                    {row.name && (
                      <p className="text-xs text-[var(--color-text-sub)] truncate max-w-[140px]">{row.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--color-text)]">
                    {row.valeur !== null ? formatEur(row.valeur) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <p className={`font-semibold ${pnlColor}`}>
                      {row.pnl !== null ? formatEur(row.pnl) : '—'}
                    </p>
                    {row.pnlPct !== null && (
                      <p className={`text-xs ${pnlColor}`}>{formatPct(row.pnlPct)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-[var(--color-text-sub)] text-xs">
                    {row.poids !== null ? `${row.poids.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col items-end gap-1">
                      <AddBuyButton id={row.id} ticker={row.ticker} />
                      <SellButton id={row.id} ticker={row.ticker} maxQuantity={row.quantity} pru={row.pru} envelope={row.envelope} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Drawer détails */}
      <Sheet open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null) }}>
        <SheetContent className="bg-[var(--color-bg-primary)] border-[var(--color-border)] w-80">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-[var(--color-text)]">{selected.ticker}</SheetTitle>
                {selected.name && (
                  <p className="text-sm text-[var(--color-text-sub)]">{selected.name}</p>
                )}
              </SheetHeader>

              <div className="space-y-4">
                {([
                  { label: 'Valeur', value: selected.valeur !== null ? formatEur(selected.valeur) : '—' },
                  { label: 'P&L', value: selected.pnl !== null ? formatEur(selected.pnl) : '—', colored: true, isGain: (selected.pnl ?? 0) >= 0 },
                  { label: 'P&L %', value: selected.pnlPct !== null ? formatPct(selected.pnlPct) : '—', colored: true, isGain: (selected.pnlPct ?? 0) >= 0 },
                  { label: 'Quantité', value: String(selected.quantity) },
                  { label: 'PRU', value: formatEur(selected.pru) },
                  { label: 'Prix actuel', value: selected.priceEur !== null ? formatEur(selected.priceEur) : '—' },
                  { label: 'Type', value: selected.type ?? '—' },
                  { label: 'Enveloppe', value: selected.envelope ?? '—' },
                  { label: 'Secteur', value: selected.sector ?? '—' },
                  { label: 'ISIN', value: selected.isin ?? '—' },
                ] as Array<{ label: string; value: string; colored?: boolean; isGain?: boolean }>).map(
                  ({ label, value, colored, isGain: itemIsGain }) => (
                    <div
                      key={label}
                      className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0"
                    >
                      <span className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">{label}</span>
                      <span className={`text-sm font-semibold ${
                        colored
                          ? itemIsGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'
                          : 'text-[var(--color-text)]'
                      }`}>
                        {value}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
