import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface FiscalTransactionRow {
  id: string
  ticker: string
  quantity: number
  price: number
  total: number
  tax_amount: number
  executed_at: string
  envelope: string | null
  asset_type: Database['public']['Enums']['asset_type'] | null
  realized_gain: number
  tax_rate: number
}

export interface FiscalSaleLine {
  id: string
  date: string
  ticker: string
  envelope: string
  assetType: Database['public']['Enums']['asset_type'] | null
  quantity: number
  unitPrice: number
  proceeds: number
  grossGain: number
  taxRate: number
  taxAmount: number
  netAmount: number
  isCryptoExempt: boolean
  hasCompleteMetadata: boolean
}

export interface FiscalEnvelopeSummary {
  key: string
  label: string
  saleCount: number
  proceeds: number
  realizedGain: number
  taxes: number
  netAmount: number
}

export interface FiscalReport {
  year: number
  generatedAt: string
  sales: FiscalSaleLine[]
  sections: FiscalEnvelopeSummary[]
  totals: {
    proceeds: number
    realizedGain: number
    taxes: number
    netAmount: number
  }
  crypto: {
    proceeds: number
    exemptionThreshold: number
    isExempt: boolean
  }
  warnings: string[]
}

type AppSupabaseClient = SupabaseClient<Database>

const CRYPTO_EXEMPTION_THRESHOLD = 305

function isMissingFiscalColumnError(message: string) {
  return (
    message.includes('column transactions.envelope does not exist') ||
    message.includes('column transactions.asset_type does not exist') ||
    message.includes('column transactions.realized_gain does not exist') ||
    message.includes('column transactions.tax_rate does not exist')
  )
}

function getYearRange(year: number) {
  return {
    from: `${year}-01-01T00:00:00.000Z`,
    to: `${year + 1}-01-01T00:00:00.000Z`,
  }
}

function normalizeEnvelope(
  envelope: string | null,
  assetType: Database['public']['Enums']['asset_type'] | null,
): FiscalEnvelopeSummary['key'] {
  if (assetType === 'crypto') return 'Crypto'
  if (envelope === 'PEA' || envelope === 'PEA-PME') return envelope
  if (envelope === 'Crypto') return 'Crypto'
  if (envelope === 'Autre' || envelope === null) return 'Autre'
  return 'CTO'
}

function deriveGain(row: FiscalTransactionRow) {
  if (Number.isFinite(row.realized_gain) && row.realized_gain !== 0) return row.realized_gain
  if (row.tax_amount > 0 && row.tax_rate > 0) return row.tax_amount / row.tax_rate
  return row.realized_gain ?? 0
}

export function buildFiscalReport(year: number, rows: FiscalTransactionRow[]): FiscalReport {
  const cryptoProceeds = rows.reduce((sum, row) => {
    const isCrypto = normalizeEnvelope(row.envelope, row.asset_type) === 'Crypto'
    return isCrypto ? sum + row.total : sum
  }, 0)
  const cryptoIsExempt = cryptoProceeds > 0 && cryptoProceeds <= CRYPTO_EXEMPTION_THRESHOLD

  const sales = rows
    .slice()
    .sort((a, b) => a.executed_at.localeCompare(b.executed_at))
    .map((row) => {
      const envelope = normalizeEnvelope(row.envelope, row.asset_type)
      const grossGain = deriveGain(row)
      const isCrypto = envelope === 'Crypto'
      const isCryptoExempt = isCrypto && cryptoIsExempt
      const hasCompleteMetadata = row.envelope !== null || row.asset_type !== null
      const taxRate = isCryptoExempt ? 0 : row.tax_rate
      const taxAmount = isCryptoExempt ? 0 : row.tax_amount
      const netAmount = row.total - taxAmount

      return {
        id: row.id,
        date: row.executed_at,
        ticker: row.ticker,
        envelope,
        assetType: row.asset_type,
        quantity: row.quantity,
        unitPrice: row.price,
        proceeds: row.total,
        grossGain,
        taxRate,
        taxAmount,
        netAmount,
        isCryptoExempt,
        hasCompleteMetadata,
      }
    })

  const sectionMap = new Map<string, FiscalEnvelopeSummary>()
  for (const sale of sales) {
    const current = sectionMap.get(sale.envelope) ?? {
      key: sale.envelope,
      label: sale.envelope,
      saleCount: 0,
      proceeds: 0,
      realizedGain: 0,
      taxes: 0,
      netAmount: 0,
    }

    current.saleCount += 1
    current.proceeds += sale.proceeds
    current.realizedGain += sale.grossGain
    current.taxes += sale.taxAmount
    current.netAmount += sale.netAmount

    sectionMap.set(sale.envelope, current)
  }

  const sections = Array.from(sectionMap.values()).sort((a, b) => b.proceeds - a.proceeds)
  const totals = sections.reduce(
    (acc, section) => ({
      proceeds: acc.proceeds + section.proceeds,
      realizedGain: acc.realizedGain + section.realizedGain,
      taxes: acc.taxes + section.taxes,
      netAmount: acc.netAmount + section.netAmount,
    }),
    { proceeds: 0, realizedGain: 0, taxes: 0, netAmount: 0 },
  )

  const warnings: string[] = []
  if (sales.some((sale) => !sale.hasCompleteMetadata)) {
    warnings.push("Certaines ventes historiques n'ont pas d'enveloppe ou de type d'actif persisté. Le classement fiscal peut être partiel tant que ces lignes ne sont pas enrichies.")
  }
  if (sales.some((sale) => sale.envelope === 'PEA' || sale.envelope === 'PEA-PME')) {
    warnings.push("Les prélèvements sociaux liés à un retrait PEA avant ou après 5 ans ne sont pas modélisés dans la base actuelle. Le rapport affiche donc les ventes PEA intra-enveloppe à 0 %.")
  }
  if (cryptoIsExempt) {
    warnings.push(`Les cessions crypto ${year} restent sous ${CRYPTO_EXEMPTION_THRESHOLD} €. Le rapport annule donc l'imposition crypto sur l'année.`)
  }

  return {
    year,
    generatedAt: new Date().toISOString(),
    sales,
    sections,
    totals,
    crypto: {
      proceeds: cryptoProceeds,
      exemptionThreshold: CRYPTO_EXEMPTION_THRESHOLD,
      isExempt: cryptoIsExempt,
    },
    warnings,
  }
}

export async function fetchFiscalTransactions(
  supabase: AppSupabaseClient,
  userId: string,
  year: number,
) {
  const { from, to } = getYearRange(year)

  const { data, error } = await supabase
    .from('transactions')
    .select('id, ticker, quantity, price, total, tax_amount, executed_at, envelope, asset_type, realized_gain, tax_rate')
    .eq('user_id', userId)
    .eq('type', 'sell')
    .gte('executed_at', from)
    .lt('executed_at', to)
    .order('executed_at', { ascending: true })

  if (!error) {
    return (data ?? []) as FiscalTransactionRow[]
  }

  if (!isMissingFiscalColumnError(error.message)) {
    throw new Error(error.message)
  }

  const fallbackQuery = await supabase
    .from('transactions')
    .select('id, ticker, quantity, price, total, tax_amount, executed_at')
    .eq('user_id', userId)
    .eq('type', 'sell')
    .gte('executed_at', from)
    .lt('executed_at', to)
    .order('executed_at', { ascending: true })

  if (fallbackQuery.error) {
    throw new Error(fallbackQuery.error.message)
  }

  return (fallbackQuery.data ?? []).map((row) => ({
    ...row,
    envelope: null,
    asset_type: null,
    realized_gain: 0,
    tax_rate: 0,
  })) as FiscalTransactionRow[]
}

export async function fetchFiscalYears(supabase: AppSupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('executed_at')
    .eq('user_id', userId)
    .eq('type', 'sell')
    .order('executed_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const years = new Set<number>()
  for (const row of data ?? []) {
    years.add(new Date(row.executed_at).getUTCFullYear())
  }

  return Array.from(years).sort((a, b) => b - a)
}
