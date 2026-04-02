'use client'

import type { DividendsApiResponse } from '@/app/api/dividends/route'
import { formatCurrency } from '@/lib/format'

interface Props {
  data: DividendsApiResponse
}

/** Formate un pourcentage */
function formatPct(value: number): string {
  return `${value.toFixed(2)} %`
}

/** Traduit la fréquence en libellé FR */
function labelFrequency(freq: string): string {
  const map: Record<string, string> = {
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    'semi-annual': 'Semestriel',
    annual: 'Annuel',
    unknown: '—',
  }
  return map[freq] ?? freq
}

/** Formate "YYYY-MM" en "Mois YYYY" */
function formatMonth(ym: string): string {
  const [year, month] = ym.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

function formatTotalsByCurrency(data: DividendsApiResponse): string {
  if (data.totalAnnualEstimate !== null) {
    const currency = data.totalsByCurrency[0]?.currency ?? null
    return formatCurrency(data.totalAnnualEstimate, currency)
  }

  if (data.totalsByCurrency.length === 0) {
    return '—'
  }

  return data.totalsByCurrency
    .map(({ currency, totalAnnualEstimate }) =>
      formatCurrency(totalAnnualEstimate, currency === 'UNKNOWN' ? null : currency),
    )
    .join(' · ')
}

/**
 * DividendProjection — résumé des projections annuelles et tableau yield on cost.
 * Affiche les cards de synthèse + le tableau par position.
 */
export default function DividendProjection({ data }: Props) {
  const { positions, totalAnnualEstimate, bestMonth, avgYieldOnCost } = data
  const hasTotals = totalAnnualEstimate !== null || data.totalsByCurrency.length > 0

  return (
    <div className="space-y-6">
      {data.isMultiCurrency && (
        <div className="glass-card rounded-2xl border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Les montants restent dans la devise de chaque position. Les agrégats globaux sont affichés par devise.
        </div>
      )}

      {/* Cards de synthèse */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-card rounded-2xl px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Revenu estimé / an
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {hasTotals ? formatTotalsByCurrency(data) : '—'}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">
            {positions.length} position{positions.length > 1 ? 's' : ''} versant des dividendes
          </p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Yield moyen on cost
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {formatPct(avgYieldOnCost)}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">Sur le PRU d&apos;achat</p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Meilleur mois
          </p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--color-text)] capitalize">
            {!data.isMultiCurrency && bestMonth ? formatMonth(bestMonth) : '—'}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">
            {data.isMultiCurrency ? 'Comparaison désactivée en multi-devises' : 'Versements concentrés'}
          </p>
        </div>

        <div className="glass-card rounded-2xl px-4 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Positions
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {positions.length}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">Avec dividendes détectés</p>
        </div>
      </div>

      {/* Tableau yield on cost par position */}
      {positions.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--color-border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
              Détail
            </p>
            <h3 className="mt-1 text-base font-semibold tracking-tight text-[var(--color-text)]">
              Yield on cost par position
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    Fréquence
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    Div./action
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    PRU
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    Yield on cost
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-dim)]">
                    Revenu annuel
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions
                  .slice()
                  .sort((a, b) => b.yieldOnCost - a.yieldOnCost)
                  .map((pos) => (
                    <tr
                      key={pos.ticker}
                      className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <td className="px-5 py-3">
                        <div>
                          <span className="font-medium text-[var(--color-text)]">{pos.ticker}</span>
                          {pos.name && (
                            <p className="text-xs text-[var(--color-text-sub)] truncate max-w-[160px]">
                              {pos.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-text-sub)]">
                        {labelFrequency(pos.frequency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text)]">
                        {formatCurrency(pos.annualDividendPerShare, pos.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text-sub)]">
                        {formatCurrency(pos.pru, pos.currency)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-[var(--color-text)]">
                        {formatPct(pos.yieldOnCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-[var(--color-text)]">
                        {formatCurrency(pos.annualDividendTotal, pos.currency)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
