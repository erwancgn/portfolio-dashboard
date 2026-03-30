'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import AddBuyButton from './AddBuyButton'
import SellButton from './SellButton'
import DcaButton from './DcaButton'
import type { PositionRow, DcaRuleMap } from './PositionsTable'
import { formatEur, formatPct, countryToFlag } from '@/lib/format'
import TickerLogo from '@/components/ui/TickerLogo'

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
      <SheetContent className="bg-[var(--color-bg-primary)] border-[var(--color-border)] w-80">
        {selected && (
          <>
            <SheetHeader className="mb-6">
              <div className="mb-3">
                <TickerLogo logoUrl={selected.logo_url} ticker={selected.ticker} size="md" />
              </div>
              <SheetTitle className="text-[var(--color-text)]">{selected.ticker}</SheetTitle>
              {selected.name && (
                <p className="text-sm text-[var(--color-text-sub)]">{selected.name}</p>
              )}
            </SheetHeader>

            <div className="space-y-4 mb-6">
              {([
                { label: 'Valeur', value: selected.valeur !== null ? formatEur(selected.valeur) : '—' },
                { label: 'P&L', value: selected.pnl !== null ? formatEur(selected.pnl) : '—', colored: true, isGain },
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
                    className="flex justify-between items-center py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <span className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">{label}</span>
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
