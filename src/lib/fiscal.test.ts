import { describe, expect, it } from 'vitest'
import { buildFiscalReport, type FiscalTransactionRow } from '@/lib/fiscal'

describe('buildFiscalReport', () => {
  it('annule la taxation crypto sous le seuil annuel', () => {
    const rows: FiscalTransactionRow[] = [
      {
        id: '1',
        ticker: 'BTC',
        quantity: 0.01,
        price: 25000,
        total: 250,
        tax_amount: 15,
        executed_at: '2025-03-10T10:00:00.000Z',
        envelope: 'Crypto',
        asset_type: 'crypto',
        realized_gain: 50,
        tax_rate: 0.3,
      },
    ]

    const report = buildFiscalReport(2025, rows)

    expect(report.crypto.isExempt).toBe(true)
    expect(report.totals.taxes).toBe(0)
    expect(report.sales[0].taxAmount).toBe(0)
    expect(report.sales[0].netAmount).toBe(250)
  })

  it('regroupe par enveloppe et remonte un warning si les métadonnées sont incomplètes', () => {
    const rows: FiscalTransactionRow[] = [
      {
        id: '1',
        ticker: 'AIR',
        quantity: 5,
        price: 150,
        total: 750,
        tax_amount: 45,
        executed_at: '2025-04-10T10:00:00.000Z',
        envelope: 'CTO',
        asset_type: 'stock',
        realized_gain: 150,
        tax_rate: 0.3,
      },
      {
        id: '2',
        ticker: 'BNP',
        quantity: 3,
        price: 90,
        total: 270,
        tax_amount: 0,
        executed_at: '2025-05-10T10:00:00.000Z',
        envelope: null,
        asset_type: null,
        realized_gain: 0,
        tax_rate: 0,
      },
    ]

    const report = buildFiscalReport(2025, rows)

    expect(report.sections).toHaveLength(2)
    expect(report.sections[0].label).toBe('CTO')
    expect(report.warnings.some((warning) => warning.includes("n'ont pas d'enveloppe"))).toBe(true)
  })

  it('estime une plus-value nulle si l ancien schema ne stocke pas realized_gain et tax_rate', () => {
    const rows: FiscalTransactionRow[] = [
      {
        id: 'legacy-1',
        ticker: 'MC',
        quantity: 2,
        price: 700,
        total: 1400,
        tax_amount: 0,
        executed_at: '2025-06-01T10:00:00.000Z',
        envelope: null,
        asset_type: null,
        realized_gain: 0,
        tax_rate: 0,
      },
    ]

    const report = buildFiscalReport(2025, rows)

    expect(report.sales[0].grossGain).toBe(0)
    expect(report.sales[0].hasCompleteMetadata).toBe(false)
  })
})
