'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import AddBuyButton from './AddBuyButton'
import SellButton from './SellButton'
import DcaButton from './DcaButton'
import type { PositionRow, DcaRuleMap } from './PositionsTable'
import { formatEur, formatPct, countryToFlag } from '@/lib/format'
import TickerLogo from '@/components/ui/TickerLogo'
import FairValue from '@/components/analyse/FairValue'

interface Props {
  selected: PositionRow | null
  onClose: () => void
  dcaRules: DcaRuleMap
}

/**
 * PositionDrawer — Client Component.
 * Sheet latéral avec les détails complets d'une position sélectionnée.
 */
export default function PositionDrawer({ selected, onClose, dcaRules }: Props) {
  const isGain = selected ? (selected.pnl ?? 0) >= 0 : false

  return (
    <Sheet open={!!selected} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent className="w-full border-[var(--color-border)] bg-[var(--color-bg-primary)] px-5 pb-5 pt-8 sm:w-[28rem]">
        {selected && (
          <>
            <SheetHeader className="mb-6">
              <div className="mb-3 flex items-center gap-3">
                <TickerLogo logoUrl={selected.logo_url} ticker={selected.ticker} size="md" />
                <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-sub)]">
                  Position
                </div>
              </div>
              <SheetTitle className="text-[var(--color-text)]">{selected.ticker}</SheetTitle>
              {selected.name && (
                <p className="text-sm text-[var(--color-text-sub)]">{selected.name}</p>
              )}
            </SheetHeader>

            <div className="mb-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-dim)]">Valeur</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
                    {selected.valeur !== null ? formatEur(selected.valeur) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--color-bg-secondary)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-dim)]">Performance</p>
                  <p className={`mt-2 text-lg font-semibold ${isGain ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'}`}>
                    {selected.pnl !== null ? formatEur(selected.pnl) : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {([
                { label: 'P&L %', value: selected.pnlPct !== null ? formatPct(selected.pnlPct) : '—', colored: true, isGain },
                { label: 'Quantité', value: String(selected.quantity) },
                { label: 'PRU', value: formatEur(selected.pru) },
                { label: 'Prix actuel', value: selected.priceEur !== null ? formatEur(selected.priceEur) : '—' },
                { label: 'Type', value: selected.type ?? '—' },
                { label: 'Enveloppe', value: selected.envelope ?? '—' },
                { label: 'Secteur', value: selected.sector ?? '—' },
                { label: 'ISIN', value: selected.isin ?? '—' },
                {
                  label: 'Pays',
                  value: selected.country
                    ? `${countryToFlag(selected.country)} ${selected.country}`
                    : '—',
                },
              ] as Array<{ label: string; value: string; colored?: boolean; isGain?: boolean }>).map(
                ({ label, value, colored, isGain: itemIsGain }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-[var(--color-border)] py-2 last:border-0"
                  >
                    <span className="text-xs uppercase tracking-wide text-[var(--color-text-sub)]">{label}</span>
                    <span className={`text-sm font-semibold tabular-nums ${
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

            {/* Analyse */}
            <div className="mb-5 border-t border-[var(--color-border)] py-4">
              <span className="mb-3 block text-xs uppercase tracking-wide text-[var(--color-text-sub)]">Analyse IA</span>
              <FairValue ticker={selected.ticker} />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <AddBuyButton id={selected.id} ticker={selected.ticker} />
              <SellButton
                id={selected.id}
                ticker={selected.ticker}
                maxQuantity={selected.quantity}
                pru={selected.pru}
                envelope={selected.envelope}
              />
              <DcaButton
                positionId={selected.id}
                ticker={selected.ticker}
                hasActiveDca={dcaRules[selected.id]?.is_active === true}
                activeDcaId={dcaRules[selected.id]?.id}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
