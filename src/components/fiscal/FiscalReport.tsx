'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { formatEur } from '@/lib/format'
import type { FiscalReport as FiscalReportData } from '@/lib/fiscal'
import type { BrokerImportDigest } from '@/lib/trade-republic'

interface FiscalReportProps {
  report: FiscalReportData
  years: number[]
  brokerDigest: BrokerImportDigest
}

function formatTaxRate(rate: number) {
  return `${(rate * 100).toFixed(1)} %`
}

function formatSignedEuro(value: number) {
  return `${value >= 0 ? '+' : '-'}${formatEur(Math.abs(value))}`
}

export default function FiscalReport({ report, years, brokerDigest }: FiscalReportProps) {
  const csvContent = useMemo(() => {
    const header = [
      'Date',
      'Ticker',
      'Enveloppe',
      'TypeActif',
      'Quantite',
      'PrixUnitaire',
      'ProduitCession',
      'PVBrute',
      'Taxe',
      'Taux',
      'Net',
    ]

    const rows = report.sales.map((sale) => [
      new Date(sale.date).toISOString().slice(0, 10),
      sale.ticker,
      sale.envelope,
      sale.assetType ?? '',
      sale.quantity.toString(),
      sale.unitPrice.toFixed(2),
      sale.proceeds.toFixed(2),
      sale.grossGain.toFixed(2),
      sale.taxAmount.toFixed(2),
      sale.taxRate.toFixed(4),
      sale.netAmount.toFixed(2),
    ])

    return [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n')
  }, [report.sales])

  function handleExportCsv() {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `rapport-fiscal-${report.year}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      <section className="glass-card overflow-hidden rounded-[28px]">
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-text-sub)]">
                Fiscal
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
                  Rapport fiscal {report.year}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-sub)] sm:text-base">
                  Synthèse annuelle des cessions, taxes estimées par enveloppe et export rapide pour la déclaration ou le comptable.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExportCsv}
                className="cursor-pointer rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:border-[var(--color-border-strong)]"
              >
                Export CSV
              </button>
              <button
                onClick={handlePrint}
                className="cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {years.length === 0 ? (
              <span className="rounded-full border border-dashed border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-sub)]">
                Aucune année avec ventes
              </span>
            ) : (
              years.map((year) => (
                <Link
                  key={year}
                  href={`/dashboard/fiscal?year=${year}`}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    year === report.year
                      ? 'border border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                      : 'border border-[var(--color-border)] bg-white/70 text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {year}
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {report.crypto.proceeds > 0 && (
        <section className={`rounded-[24px] border px-5 py-4 ${
          report.crypto.isExempt
            ? 'border-[var(--color-green)]/25 bg-[var(--color-green-bg)]'
            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
        }`}>
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--color-text-dim)]">
            Crypto
          </p>
          <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
            {report.crypto.isExempt
              ? `Cessions crypto sous le seuil d'exonération (${formatEur(report.crypto.exemptionThreshold)})`
              : "Cessions crypto imposables au barème actuellement modélisé"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">
            Total des cessions crypto {report.year} : {formatEur(report.crypto.proceeds)}
          </p>
        </section>
      )}

      {report.warnings.length > 0 && (
        <section className="space-y-3">
          {report.warnings.map((warning) => (
            <div
              key={warning}
              className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-sub)]"
            >
              {warning}
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass-card rounded-[24px] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Cessions</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{formatEur(report.totals.proceeds)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">Montant total des ventes</p>
        </article>
        <article className="glass-card rounded-[24px] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Plus-values</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{formatSignedEuro(report.totals.realizedGain)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">Gain réalisé estimé</p>
        </article>
        <article className="glass-card rounded-[24px] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Impôts</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{formatEur(report.totals.taxes)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">Taxes calculées ou annulées</p>
        </article>
        <article className="glass-card rounded-[24px] px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Net perçu</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{formatEur(report.totals.netAmount)}</p>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">Après fiscalité modélisée</p>
        </article>
      </section>

      <section className="glass-card rounded-[28px] px-5 py-5 sm:px-6">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Trade Republic
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
            Synthèse broker importée
          </h2>
        </div>

        {brokerDigest.summary.documentCount === 0 ? (
          <p className="text-sm text-[var(--color-text-sub)]">
            Aucun PDF Trade Republic importé pour {report.year}.
          </p>
        ) : (
          <div className="space-y-4">
            {brokerDigest.taxReport && (
              <div className="rounded-[22px] border border-[var(--color-green)]/25 bg-[var(--color-green-bg)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-green-text)]">
                  IFU Trade Republic
                </p>
                <h3 className="mt-1 text-base font-semibold text-[var(--color-text)]">
                  Référence déclarative {brokerDigest.taxReport.year ?? report.year}
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 3VG</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['3VG'])}</p>
                  </div>
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 3VH</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['3VH'])}</p>
                  </div>
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 2DC</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['2DC'])}</p>
                  </div>
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 2TR</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['2TR'])}</p>
                  </div>
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 2BH</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['2BH'])}</p>
                  </div>
                  <div className="rounded-[18px] bg-white/70 px-3 py-3 text-sm">
                    <p className="text-[var(--color-text-sub)]">Case 2CK</p>
                    <p className="mt-1 font-semibold text-[var(--color-text)]">{formatEur(brokerDigest.taxReport.boxes['2CK'])}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[var(--color-green-text)]">
                  Utilise en priorité cet IFU pour la déclaration 2042 / 2042 C / 2074. Total cessions : {formatEur(brokerDigest.taxReport.totals.cessions)}. Plus-values nettes : {formatEur(brokerDigest.taxReport.totals.plusValues)}.
                </p>
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Dividendes bruts</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                  {formatEur(brokerDigest.summary.grossDividends)}
                </p>
              </article>
              <article className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Impôts retenus</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                  {formatEur(brokerDigest.summary.withholdingTaxes + brokerDigest.summary.solidarityTaxes + brokerDigest.summary.foreignWithholdingTaxes)}
                </p>
              </article>
              <article className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Frais</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                  {formatEur(brokerDigest.summary.fees)}
                </p>
              </article>
              <article className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Documents</p>
                <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">
                  {brokerDigest.summary.documentCount}
                </p>
              </article>
            </div>

            <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
              <p className="text-sm text-[var(--color-text-sub)]">
                Import Trade Republic {report.year}: {brokerDigest.summary.eventCount} événements reconnus, {formatEur(brokerDigest.summary.sellAmount)} de ventes, {formatEur(brokerDigest.summary.buyAmount)} d’achats, {formatEur(brokerDigest.summary.deposits)} de dépôts, {formatEur(brokerDigest.summary.withdrawals)} de retraits.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card rounded-[28px] px-5 py-5 sm:px-6">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Par enveloppe
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
            Consolidation annuelle
          </h2>
        </div>

        {report.sections.length === 0 ? (
          <p className="text-sm text-[var(--color-text-sub)]">Aucune vente enregistrée sur {report.year}.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {report.sections.map((section) => (
              <article
                key={section.key}
                className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{section.label}</h3>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs text-[var(--color-text-sub)]">
                    {section.saleCount} vente{section.saleCount > 1 ? 's' : ''}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-text-sub)]">Cessions</dt>
                    <dd className="font-medium text-[var(--color-text)]">{formatEur(section.proceeds)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-text-sub)]">PV réalisée</dt>
                    <dd className="font-medium text-[var(--color-text)]">{formatSignedEuro(section.realizedGain)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-text-sub)]">Fiscalité</dt>
                    <dd className="font-medium text-[var(--color-text)]">{formatEur(section.taxes)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-[var(--color-text-sub)]">Net</dt>
                    <dd className="font-medium text-[var(--color-text)]">{formatEur(section.netAmount)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card rounded-[28px] px-5 py-5 sm:px-6">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Détail
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
            Review des taxes par titre
          </h2>
        </div>

        {report.sales.length === 0 ? (
          <p className="text-sm text-[var(--color-text-sub)]">Aucune cession sur {report.year}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Titre</th>
                  <th className="px-3 py-2">Enveloppe</th>
                  <th className="px-3 py-2 text-right">Cession</th>
                  <th className="px-3 py-2 text-right">PV brute</th>
                  <th className="px-3 py-2 text-right">Taxe</th>
                  <th className="px-3 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {report.sales.map((sale) => (
                  <tr key={sale.id} className="rounded-2xl bg-[var(--color-bg-secondary)] text-sm">
                    <td className="rounded-l-2xl px-3 py-3 text-[var(--color-text-sub)]">
                      {new Date(sale.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono font-semibold text-[var(--color-text)]">{sale.ticker}</div>
                      <div className="text-xs text-[var(--color-text-sub)]">
                        {sale.quantity} @ {formatEur(sale.unitPrice)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-text)]">
                      <div>{sale.envelope}</div>
                      <div className="text-xs text-[var(--color-text-sub)]">
                        {sale.isCryptoExempt ? 'Exonération crypto' : formatTaxRate(sale.taxRate)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-[var(--color-text)]">{formatEur(sale.proceeds)}</td>
                    <td className="px-3 py-3 text-right font-medium text-[var(--color-text)]">{formatSignedEuro(sale.grossGain)}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-medium text-[var(--color-text)]">{formatEur(sale.taxAmount)}</div>
                      {!sale.hasCompleteMetadata && (
                        <div className="text-xs text-[var(--color-red-text)]">Métadonnées à compléter</div>
                      )}
                    </td>
                    <td className="rounded-r-2xl px-3 py-3 text-right font-semibold text-[var(--color-text)]">{formatEur(sale.netAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
