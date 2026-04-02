import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Json, TablesInsert } from '@/types/database'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Route indisponible en production' }, { status: 403 })
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const [positionsQuery, transactionsQuery, importsQuery] = await Promise.all([
    supabase.from('positions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('broker_imports').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const existingCount =
    (positionsQuery.count ?? 0) +
    (transactionsQuery.count ?? 0) +
    (importsQuery.count ?? 0)

  if (existingCount > 0) {
    return NextResponse.json(
      { seeded: false, reason: 'existing_data' },
      { status: 200 },
    )
  }

  const positions: TablesInsert<'positions'>[] = [
    {
      user_id: user.id,
      ticker: 'MSFT',
      name: 'Microsoft Corporation',
      isin: 'US5949181045',
      quantity: 1.5,
      pru: 330,
      current_price: 0,
      currency: 'EUR',
      envelope: 'CTO',
      sector: 'Technology',
      country: 'US',
      type: 'stock',
      logo_url: 'https://images.financialmodelingprep.com/symbol/MSFT.png',
    },
    {
      user_id: user.id,
      ticker: 'ESE.PA',
      name: 'BNP Paribas Easy S&P 500 UCITS ETF',
      isin: 'FR0011550185',
      quantity: 25,
      pru: 29,
      current_price: 0,
      currency: 'EUR',
      envelope: 'PEA',
      sector: 'Financial Services',
      country: 'FR',
      type: 'etf',
      logo_url: 'https://images.financialmodelingprep.com/symbol/ESE.PA.png',
    },
    {
      user_id: user.id,
      ticker: 'BTC',
      name: 'Bitcoin',
      isin: null,
      quantity: 0.01,
      pru: 44000,
      current_price: 0,
      currency: 'EUR',
      envelope: 'Crypto',
      sector: null,
      country: null,
      type: 'crypto',
      logo_url: '',
    },
  ]

  const { data: createdPositions, error: positionsError } = await supabase
    .from('positions')
    .insert(positions)
    .select('id, ticker')

  if (positionsError) {
    return NextResponse.json({ error: positionsError.message }, { status: 500 })
  }

  const positionByTicker = new Map((createdPositions ?? []).map((position) => [position.ticker, position.id]))
  const msftId = positionByTicker.get('MSFT') ?? null
  const eseId = positionByTicker.get('ESE.PA') ?? null

  const liquidities: TablesInsert<'liquidities'>[] = [
    { user_id: user.id, envelope: 'CTO', amount: 1850 },
    { user_id: user.id, envelope: 'PEA', amount: 2400 },
    { user_id: user.id, envelope: 'Crypto', amount: 320 },
  ]

  const { error: liquiditiesError } = await supabase.from('liquidities').insert(liquidities)
  if (liquiditiesError) {
    return NextResponse.json({ error: liquiditiesError.message }, { status: 500 })
  }

  const transactions: TablesInsert<'transactions'>[] = [
    {
      user_id: user.id,
      position_id: null,
      ticker: 'CTO',
      type: 'deposit',
      quantity: 1,
      price: 2000,
      total: 2000,
      tax_amount: 0,
      executed_at: '2025-01-03T09:00:00.000Z',
      envelope: 'CTO',
      asset_type: null,
      realized_gain: 0,
      tax_rate: 0,
    },
    {
      user_id: user.id,
      position_id: null,
      ticker: 'PEA',
      type: 'deposit',
      quantity: 1,
      price: 2500,
      total: 2500,
      tax_amount: 0,
      executed_at: '2025-01-03T09:05:00.000Z',
      envelope: 'PEA',
      asset_type: null,
      realized_gain: 0,
      tax_rate: 0,
    },
    {
      user_id: user.id,
      position_id: msftId,
      ticker: 'MSFT',
      type: 'buy',
      quantity: 2,
      price: 300,
      total: 600,
      tax_amount: 0,
      executed_at: '2025-01-10T10:00:00.000Z',
      envelope: 'CTO',
      asset_type: 'stock',
      realized_gain: 0,
      tax_rate: 0,
    },
    {
      user_id: user.id,
      position_id: msftId,
      ticker: 'MSFT',
      type: 'sell',
      quantity: 1,
      price: 340,
      total: 340,
      tax_amount: 12,
      executed_at: '2025-02-18T10:00:00.000Z',
      envelope: 'CTO',
      asset_type: 'stock',
      realized_gain: 40,
      tax_rate: 0.30,
    },
    {
      user_id: user.id,
      position_id: eseId,
      ticker: 'ESE.PA',
      type: 'buy',
      quantity: 10,
      price: 28,
      total: 280,
      tax_amount: 0,
      executed_at: '2025-03-05T10:00:00.000Z',
      envelope: 'PEA',
      asset_type: 'etf',
      realized_gain: 0,
      tax_rate: 0,
    },
    {
      user_id: user.id,
      position_id: eseId,
      ticker: 'ESE.PA',
      type: 'sell',
      quantity: 4,
      price: 31,
      total: 124,
      tax_amount: 0,
      executed_at: '2025-06-12T10:00:00.000Z',
      envelope: 'PEA',
      asset_type: 'etf',
      realized_gain: 12,
      tax_rate: 0,
    },
    {
      user_id: user.id,
      position_id: null,
      ticker: 'BTC',
      type: 'sell',
      quantity: 0.005,
      price: 48000,
      total: 240,
      tax_amount: 6,
      executed_at: '2025-09-20T10:00:00.000Z',
      envelope: 'Crypto',
      asset_type: 'crypto',
      realized_gain: 20,
      tax_rate: 0.30,
    },
  ]

  const { error: transactionsError } = await supabase.from('transactions').insert(transactions)
  if (transactionsError) {
    return NextResponse.json({ error: transactionsError.message }, { status: 500 })
  }

  const summary = {
    eventCount: 0,
    warnings: [],
    parsed: {
      documentType: 'fiscal_report',
      year: 2025,
      boxes: {
        '2AB': 0,
        '2CA': 0,
        '2CK': 1,
        '2DC': 1,
        '2TR': 11,
        '2BH': 11,
        '2FU': 0,
        '2TS': 0,
        '3VG': 28,
        '3VH': 0,
        '8VL': 0,
      },
      totals: {
        cessions: 240,
        plusValues: 28,
      },
    },
  } satisfies Json

  const brokerImport: TablesInsert<'broker_imports'> = {
    user_id: user.id,
    broker: 'trade_republic',
    filename: 'TR - Rapport fiscal 2025.pdf',
    file_hash: `demo-seed-${user.id}`,
    imported_at: '2026-04-02T12:00:00.000Z',
    source_year: 2025,
    status: 'processed',
    raw_text: 'Imprime Fiscal Unique - Trade Republic - Bootstrap local',
    parser_warnings: [] as Json,
    summary,
  }

  const { error: importError } = await supabase.from('broker_imports').insert(brokerImport)
  if (importError) {
    return NextResponse.json({ error: importError.message }, { status: 500 })
  }

  return NextResponse.json({ seeded: true }, { status: 200 })
}
