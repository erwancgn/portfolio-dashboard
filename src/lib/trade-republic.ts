import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json, Tables, TablesInsert } from '@/types/database'

type AppSupabaseClient = SupabaseClient<Database>

export type BrokerImportEventType =
  | 'buy'
  | 'sell'
  | 'dividend'
  | 'deposit'
  | 'withdraw'
  | 'internal_transfer'
  | 'fee'
  | 'withholding_tax'
  | 'solidarity_tax'
  | 'foreign_withholding_tax'
  | 'interest'
  | 'gift'
  | 'other'

export interface ParsedBrokerImportEvent {
  eventType: BrokerImportEventType
  label: string
  assetName: string | null
  ticker: string | null
  isin: string | null
  quantity: number | null
  unitPrice: number | null
  grossAmount: number | null
  netAmount: number | null
  taxAmount: number
  feeAmount: number
  currency: string
  executedAt: string | null
  rawBlock: string
}

export interface ParsedTradeRepublicDocument {
  broker: 'trade_republic'
  sourceYear: number | null
  warnings: string[]
  events: ParsedBrokerImportEvent[]
  rawText: string
  fileHash: string
  summaryData: Json
}

export interface BrokerImportSummary {
  documentCount: number
  eventCount: number
  buyAmount: number
  sellAmount: number
  grossDividends: number
  withholdingTaxes: number
  solidarityTaxes: number
  foreignWithholdingTaxes: number
  fees: number
  deposits: number
  withdrawals: number
}

export interface TradeRepublicTaxReportSummary {
  documentType: 'fiscal_report'
  year: number | null
  boxes: {
    '2AB': number
    '2CA': number
    '2CK': number
    '2DC': number
    '2TR': number
    '2BH': number
    '2FU': number
    '2TS': number
    '3VG': number
    '3VH': number
    '8VL': number
  }
  totals: {
    cessions: number
    plusValues: number
  }
}

export interface BrokerImportDigest {
  imports: Tables<'broker_imports'>[]
  summary: BrokerImportSummary
  taxReport: TradeRepublicTaxReportSummary | null
}

function isMissingBrokerImportTableError(message: string) {
  return (
    message.includes('relation "public.broker_imports" does not exist') ||
    message.includes('relation "public.broker_import_events" does not exist') ||
    message.includes('Could not find the table') ||
    message.includes('broker_imports')
  )
}

function emptyTaxReportSummary(): TradeRepublicTaxReportSummary['boxes'] {
  return {
    '2AB': 0,
    '2CA': 0,
    '2CK': 0,
    '2DC': 0,
    '2TR': 0,
    '2BH': 0,
    '2FU': 0,
    '2TS': 0,
    '3VG': 0,
    '3VH': 0,
    '8VL': 0,
  }
}

const DOCUMENT_KEYWORDS: Array<{
  type: BrokerImportEventType
  label: string
  patterns: RegExp[]
}> = [
  { type: 'buy', label: 'Achat', patterns: [/\bkauf\b/i, /\bachat\b/i, /sparplanausf[üu]hrung/i] },
  { type: 'sell', label: 'Vente', patterns: [/\bverkauf\b/i, /\bvente\b/i] },
  { type: 'dividend', label: 'Dividende', patterns: [/\bdividende\b/i, /\baussch[üu]ttung\b/i, /\bcoupon\b/i] },
  { type: 'deposit', label: 'Dépôt', patterns: [/\beinzahlung\b/i, /virement entrant/i, /\bd[ée]p[ôo]t\b/i] },
  { type: 'withdraw', label: 'Retrait', patterns: [/\bauszahlung\b/i, /virement sortant/i, /\bretrait\b/i] },
  { type: 'interest', label: 'Intérêts', patterns: [/\bzinsen\b/i, /interest/i, /int[ée]r[êe]ts/i] },
  { type: 'withholding_tax', label: 'Impôt retenu', patterns: [/\bkapitalertragsteuer\b/i, /pr[ée]l[èe]vement/i, /\bimp[ôo]t\b/i] },
  { type: 'solidarity_tax', label: 'Solidarité', patterns: [/\bsolidarit[äa]tszuschlag\b/i] },
  { type: 'foreign_withholding_tax', label: 'Retenue étrangère', patterns: [/\bquellensteuer\b/i, /withholding tax/i] },
  { type: 'fee', label: 'Frais', patterns: [/\bgeb[üu]hr\b/i, /\bkosten\b/i, /\bfrais\b/i] },
]

const AMOUNT_REGEX = /-?\d{1,3}(?:[.\s]\d{3})*,\d{2}\s?(?:€|EUR)/g
const DATE_REGEX = /\b(\d{2})[./](\d{2})[./](\d{4})\b/
const ISIN_REGEX = /\b([A-Z]{2}[A-Z0-9]{10})\b/
const TICKER_REGEX = /\bTicker[:\s]+([A-Z0-9.-]{1,15})\b/i
const QUANTITY_REGEX = /\b(\d+(?:[.,]\d+)?)\s*(?:stk|st\.|shares|parts|anteile|unit[ée]s)\b/i
const UNIT_PRICE_REGEX = /\b(?:kurs|preis|prix)\s+(\d{1,3}(?:[.\s]\d{3})*,\d{2})\s?(?:€|EUR)\b/i
const QUANTITY_INLINE_REGEX = /quantity:\s*([0-9.,]+)/i
const PERIOD_YEAR_REGEX = /DATE\s+\d{2}\s+\S+\s+(\d{4})\s+-\s+\d{2}\s+\S+\s+\d{4}/i

const FRENCH_MONTHS: Record<string, string> = {
  'janv.': '01',
  'févr.': '02',
  'mars': '03',
  'avr.': '04',
  'mai': '05',
  'juin': '06',
  'juil.': '07',
  'août': '08',
  'sept.': '09',
  'oct.': '10',
  'nov.': '11',
  'déc.': '12',
}

function parseEuroAmount(rawAmount: string) {
  const normalized = rawAmount
    .replace(/\s?(€|EUR)/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const value = Number(normalized)
  return Number.isFinite(value) ? value : null
}

function parseDate(rawBlock: string) {
  const match = rawBlock.match(DATE_REGEX)
  if (!match) return null

  const [, dd, mm, yyyy] = match
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, ' ').trim()
}

function parseFrenchDateLine(line: string, year: number | null) {
  const match = line.match(/^(\d{2})\s+([a-zéûîôàèùç.]+)\s*(\d{4})?$/i)
  if (!match) return null

  const day = match[1]
  const rawMonth = match[2].toLowerCase()
  const inlineYear = match[3] ? Number(match[3]) : year
  const month = FRENCH_MONTHS[rawMonth]

  if (!month || !inlineYear) return null

  return `${inlineYear}-${month}-${day}T00:00:00.000Z`
}

function classifyStatementDescription(description: string): {
  type: BrokerImportEventType
  label: string
} {
  if (/sell trade/i.test(description)) return { type: 'sell', label: 'Vente' }
  if (/buy trade|savings plan execution/i.test(description)) return { type: 'buy', label: 'Achat' }
  if (/cash dividend/i.test(description)) return { type: 'dividend', label: 'Dividende' }
  if (/interest payment/i.test(description)) return { type: 'interest', label: 'Intérêts' }
  if (/incoming transfer/i.test(description)) return { type: 'deposit', label: 'Dépôt' }
  if (/versement pea/i.test(description)) return { type: 'internal_transfer', label: 'Virement interne' }
  if (/you won a prize|cadeau/i.test(description)) return { type: 'gift', label: 'Cadeau' }
  return { type: 'other', label: 'Autre' }
}

function extractStatementTransactionAmount(description: string) {
  const amounts = extractAmounts(description)

  if (amounts.length >= 2) {
    return Math.abs(amounts[amounts.length - 2])
  }

  if (amounts.length === 1) {
    return Math.abs(amounts[0])
  }

  return null
}

function parseStatementTransactions(rawText: string, year: number | null) {
  const lines = rawText.split('\n').map(normalizeLine).filter(Boolean)
  const events: ParsedBrokerImportEvent[] = []

  const ignoredLines = [
    'TRANSACTIONS',
    "SYNTHÈSE DU RELEVÉ DE COMPTE",
    "APERÇU DU SOLDE",
    "REMARQUES SUR LE RELEVÉ DE COMPTE",
  ]

  let index = 0
  while (index < lines.length) {
    const currentLine = lines[index]
    const executedAt = parseFrenchDateLine(currentLine, year)

    if (!executedAt) {
      index += 1
      continue
    }

    const blockLines = [currentLine]
    index += 1

    while (index < lines.length && !parseFrenchDateLine(lines[index], year)) {
      const candidate = lines[index]
      if (
        candidate.startsWith('-- ') ||
        candidate.startsWith('Généré le ') ||
        candidate.startsWith('TRADE REPUBLIC BANK') ||
        ignoredLines.includes(candidate)
      ) {
        index += 1
        continue
      }

      blockLines.push(candidate)
      index += 1
    }

    const description = blockLines.slice(1).join(' ')
    if (!description) continue

    const { type, label } = classifyStatementDescription(description)
    const isinMatch = description.match(ISIN_REGEX)
    const quantityMatch = description.match(QUANTITY_INLINE_REGEX)
    const amount = extractStatementTransactionAmount(description)
    const assetMatch = description.match(
      /(?:Buy trade|Sell trade|Savings plan execution)\s+([A-Z0-9]{12})\s+(.+?),\s+quantity:/i,
    )

    if (type === 'other' && amount === null && !isinMatch) {
      continue
    }

    events.push({
      eventType: type,
      label,
      assetName: assetMatch?.[2] ?? null,
      ticker: null,
      isin: assetMatch?.[1] ?? isinMatch?.[1] ?? null,
      quantity: quantityMatch ? Number(quantityMatch[1].replace(',', '.')) : null,
      unitPrice: amount,
      grossAmount: amount,
      netAmount: amount,
      taxAmount: 0,
      feeAmount: 0,
      currency: 'EUR',
      executedAt,
      rawBlock: blockLines.join('\n'),
    })
  }

  return events
}

function extractTaxBoxValue(rawText: string, boxCode: keyof TradeRepublicTaxReportSummary['boxes']) {
  const match = rawText.match(new RegExp(`\\b${boxCode}\\s+(-?\\d+(?:[.,]\\d+)?)\\b`))
  if (!match) return 0
  return Number(match[1].replace(',', '.'))
}

function parseFiscalReportSummary(rawText: string): TradeRepublicTaxReportSummary | null {
  if (!/imprim[ée]\s+fiscal\s+unique|d[ée]claration r[ée]capitulative/i.test(rawText)) {
    return null
  }

  const yearMatch = rawText.match(/Ann[ée]e\s+(\d{4})/i) ?? rawText.match(/\b2025\b/)
  const year = yearMatch ? Number(yearMatch[1] ?? yearMatch[0]) : null
  const boxes = emptyTaxReportSummary()

  ;(Object.keys(boxes) as Array<keyof typeof boxes>).forEach((boxCode) => {
    boxes[boxCode] = extractTaxBoxValue(rawText, boxCode)
  })

  const totalCessionsMatch = rawText.match(/Total des cessions\s+(-?\d+(?:[.,]\d+)?)\s+(-?\d+(?:[.,]\d+)?)/i)
  const totals = {
    cessions: totalCessionsMatch ? Number(totalCessionsMatch[1].replace(',', '.')) : 0,
    plusValues: totalCessionsMatch ? Number(totalCessionsMatch[2].replace(',', '.')) : boxes['3VG'] - boxes['3VH'],
  }

  return {
    documentType: 'fiscal_report',
    year,
    boxes,
    totals,
  }
}

function detectEventType(rawBlock: string) {
  const hit = DOCUMENT_KEYWORDS.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(rawBlock)),
  )

  return hit ?? { type: 'other' as const, label: 'Autre', patterns: [] }
}

function extractAssetName(lines: string[]) {
  const ignored = [
    'trade republic',
    'wertpapierabrechnung',
    'kontoauszug',
    'steuerabrechnung',
    'abrechnung',
  ]

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 4) continue
    const lower = trimmed.toLowerCase()
    if (ignored.some((token) => lower.includes(token))) continue
    if (DATE_REGEX.test(trimmed)) continue
    if (AMOUNT_REGEX.test(trimmed)) continue
    return trimmed
  }

  return null
}

function extractAmounts(rawBlock: string) {
  return Array.from(rawBlock.matchAll(AMOUNT_REGEX))
    .map((match) => parseEuroAmount(match[0]))
    .filter((value): value is number => value !== null)
}

function extractFeeAmount(rawBlock: string) {
  const feeLines = rawBlock
    .split('\n')
    .filter((line) => /\bgeb[üu]hr\b|\bkosten\b|\bfrais\b/i.test(line))
  const amounts = feeLines.flatMap(extractAmounts)
  return amounts.reduce((sum, value) => sum + Math.abs(value), 0)
}

function extractTaxAmount(rawBlock: string, pattern: RegExp) {
  const taxLines = rawBlock.split('\n').filter((line) => pattern.test(line))
  const amounts = taxLines.flatMap(extractAmounts)
  return amounts.reduce((sum, value) => sum + Math.abs(value), 0)
}

function deriveEventAmounts(type: BrokerImportEventType, amounts: number[]) {
  if (amounts.length === 0) {
    return { grossAmount: null, netAmount: null }
  }

  switch (type) {
    case 'buy':
    case 'deposit':
    case 'withdraw':
    case 'fee':
    case 'withholding_tax':
    case 'solidarity_tax':
    case 'foreign_withholding_tax':
      return {
        grossAmount: Math.abs(amounts[0]),
        netAmount: Math.abs(amounts[amounts.length - 1]),
      }
    case 'sell':
    case 'dividend':
    case 'interest':
      return {
        grossAmount: Math.abs(amounts[0]),
        netAmount: Math.abs(amounts[amounts.length - 1]),
      }
    default:
      return {
        grossAmount: Math.abs(amounts[0]),
        netAmount: Math.abs(amounts[amounts.length - 1]),
      }
  }
}

function buildDerivedTaxEvents(rawBlock: string, executedAt: string | null) {
  const derived: ParsedBrokerImportEvent[] = []

  const taxDescriptors: Array<{ type: BrokerImportEventType; label: string; pattern: RegExp }> = [
    { type: 'withholding_tax', label: 'Impôt retenu', pattern: /\bkapitalertragsteuer\b|pr[ée]l[èe]vement|imp[ôo]t/i },
    { type: 'solidarity_tax', label: 'Solidarité', pattern: /\bsolidarit[äa]tszuschlag\b/i },
    { type: 'foreign_withholding_tax', label: 'Retenue étrangère', pattern: /\bquellensteuer\b|withholding tax/i },
    { type: 'fee', label: 'Frais', pattern: /\bgeb[üu]hr\b|\bkosten\b|\bfrais\b/i },
  ]

  for (const descriptor of taxDescriptors) {
    const amount =
      descriptor.type === 'fee'
        ? extractFeeAmount(rawBlock)
        : extractTaxAmount(rawBlock, descriptor.pattern)

    if (amount <= 0) continue

    derived.push({
      eventType: descriptor.type,
      label: descriptor.label,
      assetName: null,
      ticker: null,
      isin: null,
      quantity: null,
      unitPrice: null,
      grossAmount: amount,
      netAmount: amount,
      taxAmount: descriptor.type === 'fee' ? 0 : amount,
      feeAmount: descriptor.type === 'fee' ? amount : 0,
      currency: 'EUR',
      executedAt,
      rawBlock,
    })
  }

  return derived
}

export function parseTradeRepublicText(rawInput: string, fileHash: string) {
  const rawText = rawInput.replace(/\r/g, '').trim()
  const warnings: string[] = []

  if (!rawText) {
    throw new Error('Le PDF ne contient pas de texte extractible')
  }

  const fiscalReport = parseFiscalReportSummary(rawText)
  if (fiscalReport) {
    return {
      broker: 'trade_republic' as const,
      sourceYear: fiscalReport.year,
      warnings,
      events: [],
      rawText,
      fileHash,
      summaryData: fiscalReport as unknown as Json,
    } satisfies ParsedTradeRepublicDocument
  }

  const yearMatch = rawText.match(PERIOD_YEAR_REGEX)
  const statementYear = yearMatch ? Number(yearMatch[1]) : null
  const statementEvents = parseStatementTransactions(rawText, statementYear)

  if (statementEvents.length > 0) {
    return {
      broker: 'trade_republic' as const,
      sourceYear: statementYear,
      warnings,
      events: statementEvents,
      rawText,
      fileHash,
      summaryData: {
        documentType: 'statement',
        eventCount: statementEvents.length,
        warnings,
      } satisfies Json,
    } satisfies ParsedTradeRepublicDocument
  }

  const blocks = rawText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)

  const events: ParsedBrokerImportEvent[] = []

  for (const block of blocks) {
    const { type, label } = detectEventType(block)
    const amounts = extractAmounts(block)
    const executedAt = parseDate(block)
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const isinMatch = block.match(ISIN_REGEX)
    const tickerMatch = block.match(TICKER_REGEX)
    const quantityMatch = block.match(QUANTITY_REGEX)
    const unitPriceMatch = block.match(UNIT_PRICE_REGEX)
    const assetName = extractAssetName(lines)
    const { grossAmount, netAmount } = deriveEventAmounts(type, amounts)

    const hasUsefulSignal =
      type !== 'other' ||
      executedAt !== null ||
      grossAmount !== null ||
      isinMatch !== null

    if (!hasUsefulSignal) continue

    const primaryEvent: ParsedBrokerImportEvent = {
      eventType: type,
      label,
      assetName,
      ticker: tickerMatch?.[1] ?? null,
      isin: isinMatch?.[1] ?? null,
      quantity: quantityMatch ? Number(quantityMatch[1].replace(',', '.')) : null,
      unitPrice: unitPriceMatch ? parseEuroAmount(unitPriceMatch[1]) : null,
      grossAmount,
      netAmount,
      taxAmount: 0,
      feeAmount: 0,
      currency: 'EUR',
      executedAt,
      rawBlock: block,
    }

    events.push(primaryEvent)
    events.push(...buildDerivedTaxEvents(block, executedAt))
  }

  if (events.length === 0) {
    warnings.push("Aucun mouvement n'a pu être reconnu automatiquement dans ce PDF. Le parser Trade Republic devra probablement être ajusté sur un document réel.")
  }

  const datedEvents = events.filter((event) => event.executedAt !== null)
  const sourceYear = datedEvents.length > 0
    ? new Date(datedEvents[0].executedAt!).getUTCFullYear()
    : null

  return {
    broker: 'trade_republic' as const,
    sourceYear,
    warnings,
    events,
    rawText,
    fileHash,
    summaryData: {
      documentType: 'generic',
      eventCount: events.length,
      warnings,
    } satisfies Json,
  } satisfies ParsedTradeRepublicDocument
}

function emptySummary(): BrokerImportSummary {
  return {
    documentCount: 0,
    eventCount: 0,
    buyAmount: 0,
    sellAmount: 0,
    grossDividends: 0,
    withholdingTaxes: 0,
    solidarityTaxes: 0,
    foreignWithholdingTaxes: 0,
    fees: 0,
    deposits: 0,
    withdrawals: 0,
  }
}

export function summarizeBrokerEvents(events: Tables<'broker_import_events'>[]): BrokerImportSummary {
  return events.reduce((summary, event) => {
    summary.eventCount += 1

    switch (event.event_type) {
      case 'buy':
        summary.buyAmount += event.net_amount ?? event.gross_amount ?? 0
        break
      case 'sell':
        summary.sellAmount += event.net_amount ?? event.gross_amount ?? 0
        break
      case 'dividend':
        summary.grossDividends += event.gross_amount ?? event.net_amount ?? 0
        break
      case 'withholding_tax':
        summary.withholdingTaxes += event.tax_amount || event.net_amount || 0
        break
      case 'solidarity_tax':
        summary.solidarityTaxes += event.tax_amount || event.net_amount || 0
        break
      case 'foreign_withholding_tax':
        summary.foreignWithholdingTaxes += event.tax_amount || event.net_amount || 0
        break
      case 'fee':
        summary.fees += event.fee_amount || event.net_amount || 0
        break
      case 'deposit':
        summary.deposits += event.net_amount ?? event.gross_amount ?? 0
        break
      case 'withdraw':
        summary.withdrawals += event.net_amount ?? event.gross_amount ?? 0
        break
    }

    return summary
  }, emptySummary())
}

export async function persistTradeRepublicImport(
  supabase: AppSupabaseClient,
  userId: string,
  filename: string,
  parsed: ParsedTradeRepublicDocument,
) {
  const summary = {
    eventCount: parsed.events.length,
    warnings: parsed.warnings,
    parsed: parsed.summaryData,
  } satisfies Json

  const { data: existingImport } = await supabase
    .from('broker_imports')
    .select('id')
    .eq('user_id', userId)
    .eq('file_hash', parsed.fileHash)
    .maybeSingle()

  if (existingImport) {
    return existingImport.id
  }

  const importRow: TablesInsert<'broker_imports'> = {
    user_id: userId,
    broker: parsed.broker,
    filename,
    file_hash: parsed.fileHash,
    source_year: parsed.sourceYear,
    status: 'processed',
    raw_text: parsed.rawText,
    parser_warnings: parsed.warnings as Json,
    summary,
  }

  const { data: createdImport, error: importError } = await supabase
    .from('broker_imports')
    .insert(importRow)
    .select('id')
    .single()

  if (importError) {
    throw new Error(importError.message)
  }

  if (parsed.events.length > 0) {
    const eventRows: TablesInsert<'broker_import_events'>[] = parsed.events.map((event) => ({
      import_id: createdImport.id,
      user_id: userId,
      broker: parsed.broker,
      event_type: event.eventType,
      label: event.label,
      asset_name: event.assetName,
      ticker: event.ticker,
      isin: event.isin,
      quantity: event.quantity,
      unit_price: event.unitPrice,
      gross_amount: event.grossAmount,
      net_amount: event.netAmount,
      tax_amount: event.taxAmount,
      fee_amount: event.feeAmount,
      currency: event.currency,
      executed_at: event.executedAt,
      raw_block: event.rawBlock,
    }))

    const { error: eventsError } = await supabase
      .from('broker_import_events')
      .insert(eventRows)

    if (eventsError) {
      throw new Error(eventsError.message)
    }
  }

  return createdImport.id
}

export async function fetchBrokerImportDigest(
  supabase: AppSupabaseClient,
  userId: string,
  year: number,
) {
  const from = `${year}-01-01T00:00:00.000Z`
  const to = `${year + 1}-01-01T00:00:00.000Z`

  const [importsQuery, eventsQuery] = await Promise.all([
    supabase
      .from('broker_imports')
      .select('*')
      .eq('user_id', userId)
      .eq('broker', 'trade_republic')
      .or(`source_year.eq.${year},source_year.is.null`)
      .order('imported_at', { ascending: false }),
    supabase
      .from('broker_import_events')
      .select('*')
      .eq('user_id', userId)
      .eq('broker', 'trade_republic')
      .gte('executed_at', from)
      .lt('executed_at', to)
      .order('executed_at', { ascending: false }),
  ])

  if (importsQuery.error || eventsQuery.error) {
    const message = importsQuery.error?.message ?? eventsQuery.error?.message ?? ''
    if (isMissingBrokerImportTableError(message)) {
      return {
        imports: [],
        summary: emptySummary(),
        taxReport: null,
      } satisfies BrokerImportDigest
    }
    throw new Error(message)
  }

  const summary = summarizeBrokerEvents(eventsQuery.data ?? [])
  summary.documentCount = importsQuery.data?.length ?? 0

  const latestTaxReport = (importsQuery.data ?? [])
    .map((entry) => {
      const parsed = typeof entry.summary === 'object' && entry.summary !== null
        ? (entry.summary as Record<string, Json>).parsed
        : null

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
      if ((parsed as Record<string, Json>).documentType !== 'fiscal_report') return null
      return parsed as unknown as TradeRepublicTaxReportSummary
    })
    .find((entry) => entry !== null) ?? null

  return {
    imports: importsQuery.data ?? [],
    summary,
    taxReport: latestTaxReport,
  } satisfies BrokerImportDigest
}
