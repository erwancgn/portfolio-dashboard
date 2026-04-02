import { describe, expect, it } from 'vitest'
import {
  parseTradeRepublicText,
  summarizeBrokerEvents,
} from '@/lib/trade-republic'
import type { Tables } from '@/types/database'

describe('parseTradeRepublicText', () => {
  it('reconnait une vente et des taxes associées', () => {
    const text = `
      Trade Republic

      Verkauf
      Apple Inc.
      ISIN US0378331005
      15.03.2025
      2 Stk
      Preis 180,00 EUR
      360,00 EUR
      Kapitalertragsteuer 12,00 EUR
      Solidaritätszuschlag 0,66 EUR
    `

    const parsed = parseTradeRepublicText(text, 'hash-test')

    expect(parsed.events.some((event) => event.eventType === 'sell')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'withholding_tax')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'solidarity_tax')).toBe(true)
  })

  it('parse le format relevé mensuel Trade Republic réel', () => {
    const text = `
DATE 01 déc. 2025 - 31 déc. 2025
SYNTHÈSE DU RELEVÉ DE COMPTE
TRANSACTIONS
01 déc.
2025
Intérêts Interest payment 1,01 € 643,84 €
02 déc.
2025
Virement Incoming transfer from M. COGNEE ERWAN (FR7614806000007200151449146) 300,00 € 944,03 €
08 déc.
2025
Exécution
d'ordre Buy trade US64110L1061 NETFLIX INC. DL-,001, quantity: 2 166,82 € 680,25 €
09 déc.
2025
Exécution
d'ordre Sell trade IE00BQT3WG13 iShares IV plc - iShares MSCI China A UCITS ETF USD (Acc), quantity: 6.494588 30,29 € 503,82 €
15 déc.
2025
Rendement Cash Dividend for ISIN US02079K3059 0,10 € 503,92 €
29 déc.
2025
Cadeau You won a prize in the lottery! ISIN: US02079K3059 76,00 € 468,54 €
`

    const parsed = parseTradeRepublicText(text, 'hash-statement')

    expect(parsed.sourceYear).toBe(2025)
    expect(parsed.events.some((event) => event.eventType === 'interest')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'deposit')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'buy')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'sell')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'dividend')).toBe(true)
    expect(parsed.events.some((event) => event.eventType === 'gift')).toBe(true)
  })

  it('parse l IFU Trade Republic et extrait les cases fiscales', () => {
    const text = `
      Imprimé Fiscal Unique 2025
      Revenus des actions et parts 2DC 1
      Produits de placement à revenu fixe 2TR 11
      Revenus déjà soumis aux prélèvements sociaux avec CSG déductible si option barème 2BH 11
      Prélèvement forfaitaire non libératoire déjà versé 2CK 1
      Gains sur cessions de valeurs mobilières, marchés à terme, options négociables et bons option 3VG 28
      Pertes sur cessions de valeurs mobilières, marchés à terme, options négociables et bons option 3VH 0
      Total des cessions 240 28
    `

    const parsed = parseTradeRepublicText(text, 'hash-ifu')
    const summary = parsed.summaryData as { documentType: string; boxes: Record<string, number>; totals: Record<string, number> }

    expect(parsed.events).toHaveLength(0)
    expect(summary.documentType).toBe('fiscal_report')
    expect(summary.boxes['2DC']).toBe(1)
    expect(summary.boxes['2TR']).toBe(11)
    expect(summary.boxes['2BH']).toBe(11)
    expect(summary.boxes['2CK']).toBe(1)
    expect(summary.boxes['3VG']).toBe(28)
    expect(summary.totals.cessions).toBe(240)
    expect(summary.totals.plusValues).toBe(28)
  })
})

describe('summarizeBrokerEvents', () => {
  it('agrège les montants importés pour la synthèse fiscale broker', () => {
    const events: Tables<'broker_import_events'>[] = [
      {
        id: '1',
        import_id: 'a',
        user_id: 'u',
        broker: 'trade_republic',
        event_type: 'dividend',
        label: 'Dividende',
        asset_name: 'Apple',
        ticker: 'AAPL',
        isin: 'US0378331005',
        quantity: null,
        unit_price: null,
        gross_amount: 52,
        net_amount: 40,
        tax_amount: 0,
        fee_amount: 0,
        currency: 'EUR',
        executed_at: '2025-03-15T00:00:00.000Z',
        raw_block: null,
      },
      {
        id: '2',
        import_id: 'a',
        user_id: 'u',
        broker: 'trade_republic',
        event_type: 'withholding_tax',
        label: 'Impôt',
        asset_name: null,
        ticker: null,
        isin: null,
        quantity: null,
        unit_price: null,
        gross_amount: 12,
        net_amount: 12,
        tax_amount: 12,
        fee_amount: 0,
        currency: 'EUR',
        executed_at: '2025-03-15T00:00:00.000Z',
        raw_block: null,
      },
      {
        id: '3',
        import_id: 'a',
        user_id: 'u',
        broker: 'trade_republic',
        event_type: 'fee',
        label: 'Frais',
        asset_name: null,
        ticker: null,
        isin: null,
        quantity: null,
        unit_price: null,
        gross_amount: 1,
        net_amount: 1,
        tax_amount: 0,
        fee_amount: 1,
        currency: 'EUR',
        executed_at: '2025-03-15T00:00:00.000Z',
        raw_block: null,
      },
    ]

    const summary = summarizeBrokerEvents(events)

    expect(summary.grossDividends).toBe(52)
    expect(summary.withholdingTaxes).toBe(12)
    expect(summary.fees).toBe(1)
  })
})
