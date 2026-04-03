/**
 * GET /api/dividends
 * Retourne pour chaque position de l'utilisateur :
 * - Historique réel des dividendes (FMP)
 * - Projections sur 12 mois glissants
 * - Yield on cost calculé avec le PRU Supabase
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  fetchTickerDividends,
  FmpConfigurationError,
  FmpRateLimitError,
  FmpServiceError,
} from '@/lib/fmp-dividends'
import { getQuantityHeldOnDate } from '@/lib/dividend-position-history'
import type { Tables } from '@/types/database'

type Position = Tables<'positions'>
type Transaction = Tables<'transactions'>

/** Résumé d'une position avec ses données dividendes */
export interface PositionDividendSummary {
  ticker: string
  name: string | null
  quantity: number
  pru: number
  envelope: string | null
  currency: string | null
  frequency: string
  annualDividendPerShare: number
  annualDividendTotal: number
  yieldOnCost: number
  history: Array<{
    date: string
    amount: number
    total: number
    paymentDate: string | null
  }>
  projected: Array<{
    date: string
    amount: number
    total: number
  }>
}

/** Réponse de la route */
export interface DividendsApiResponse {
  positions: PositionDividendSummary[]
  totalAnnualEstimate: number | null
  totalsByCurrency: Array<{
    currency: string
    totalAnnualEstimate: number
  }>
  isMultiCurrency: boolean
  bestMonth: string | null
  avgYieldOnCost: number
  warnings: string[]
  skippedTickers: string[]
}

/** Réponse d'erreur */
interface ErrorResponse {
  error: string
  code: string
}

/**
 * Calcule le meilleur mois (celui qui concentre le plus de dividendes projetés).
 *
 * @param allProjected - Tous les dividendes projetés de toutes les positions
 */
function findBestMonth(
  allProjected: Array<{ date: string; total: number }>,
): string | null {
  if (allProjected.length === 0) return null

  const byMonth: Record<string, number> = {}
  for (const div of allProjected) {
    const month = div.date.slice(0, 7) // "YYYY-MM"
    byMonth[month] = (byMonth[month] ?? 0) + div.total
  }

  const best = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0]
  return best ? best[0] : null
}

function normalizeCurrency(currency: string | null | undefined): string | null {
  if (!currency) return null
  return currency.trim().toUpperCase()
}

/**
 * GET /api/dividends
 * Auth requise. Évite les appels inutiles et limite l'usage quota FMP.
 * Les lignes crypto sont ignorées (pas de dividendes), et en cas de quota atteint
 * les tickers restants sont sautés pour éviter de brûler plus de requêtes.
 */
export async function GET(): Promise<NextResponse<DividendsApiResponse | ErrorResponse>> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Non authentifié', code: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  const { data: positions, error: dbError } = await supabase
    .from('positions')
    .select('id, ticker, name, quantity, pru, envelope, currency, type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (dbError) {
    return NextResponse.json(
      { error: `Erreur base de données : ${dbError.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  const safePositions = (positions ?? []) as Pick<
    Position,
    'id' | 'ticker' | 'name' | 'quantity' | 'pru' | 'envelope' | 'currency' | 'type'
  >[]

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('position_id, ticker, type, quantity, executed_at')
    .eq('user_id', user.id)
    .in('type', ['buy', 'sell'])

  if (transactionsError) {
    return NextResponse.json(
      { error: `Erreur base de données : ${transactionsError.message}`, code: 'DB_ERROR' },
      { status: 500 },
    )
  }

  const transactionIndex = new Map<string, Array<{
    positionId: string | null
    ticker: string
    type: string
    quantity: number
    executedAt: string
  }>>()

  for (const transaction of ((transactions ?? []) as Pick<
    Transaction,
    'position_id' | 'ticker' | 'type' | 'quantity' | 'executed_at'
  >[])) {
    const key = transaction.position_id ?? transaction.ticker
    const existing = transactionIndex.get(key) ?? []
    existing.push({
      positionId: transaction.position_id,
      ticker: transaction.ticker,
      type: transaction.type,
      quantity: Number(transaction.quantity),
      executedAt: transaction.executed_at,
    })
    transactionIndex.set(key, existing)
  }

  const dividendPositions: PositionDividendSummary[] = []
  const warnings: string[] = []
  const skippedTickers = new Set<string>()
  const dividendCandidates = safePositions.filter((pos) => pos.type !== 'crypto')
  let fmpQuotaLimited = false

  for (const pos of dividendCandidates) {
    if (fmpQuotaLimited) {
      skippedTickers.add(pos.ticker)
      continue
    }

    let data: Awaited<ReturnType<typeof fetchTickerDividends>>
    try {
      data = await fetchTickerDividends(pos.ticker)
    } catch (error) {
      if (error instanceof FmpRateLimitError) {
        skippedTickers.add(pos.ticker)
        fmpQuotaLimited = true
        continue
      }
      if (error instanceof FmpConfigurationError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 503 },
        )
      }
      if (error instanceof FmpServiceError) {
        warnings.push(error.message)
        continue
      }
      return NextResponse.json(
        { error: 'Erreur inattendue lors du chargement des dividendes.', code: 'UNKNOWN_ERROR' },
        { status: 500 },
      )
    }

    if (!data) continue // Pas de dividende pour ce ticker

    const annualTotal = data.annualDividendPerShare * pos.quantity
    const positionTransactions = transactionIndex.get(pos.id) ?? transactionIndex.get(pos.ticker) ?? []
    const currency = normalizeCurrency(pos.currency)
    const yieldOnCost =
      pos.pru > 0 ? (data.annualDividendPerShare / pos.pru) * 100 : 0

    dividendPositions.push({
      ticker: pos.ticker,
      name: pos.name,
      quantity: pos.quantity,
      pru: pos.pru,
      envelope: pos.envelope,
      currency,
      frequency: data.frequency,
      annualDividendPerShare: data.annualDividendPerShare,
      annualDividendTotal: annualTotal,
      yieldOnCost,
      history: data.history.slice(0, 20).map((h) => {
        const quantityAtDate = getQuantityHeldOnDate(
          pos.quantity,
          h.recordDate ?? h.date,
          positionTransactions,
        )

        return {
          date: h.date,
          amount: h.amount,
          total: h.amount * quantityAtDate,
          paymentDate: h.paymentDate,
        }
      }),
      projected: data.projected.map((p) => ({
        date: p.date,
        amount: p.amount,
        total: p.amount * pos.quantity,
      })),
    })
  }

  if (dividendPositions.length === 0 && skippedTickers.size > 0) {
    for (const pos of dividendCandidates) {
      if (!skippedTickers.has(pos.ticker)) continue
      dividendPositions.push({
        ticker: pos.ticker,
        name: pos.name,
        quantity: pos.quantity,
        pru: pos.pru,
        envelope: pos.envelope,
        currency: normalizeCurrency(pos.currency),
        frequency: 'unknown',
        annualDividendPerShare: 0,
        annualDividendTotal: 0,
        yieldOnCost: 0,
        history: [],
        projected: [],
      })
    }
  }

  const totalsByCurrency = [...dividendPositions.reduce((map, position) => {
    const currency = position.currency ?? 'UNKNOWN'
    map.set(currency, (map.get(currency) ?? 0) + position.annualDividendTotal)
    return map
  }, new Map<string, number>()).entries()]
    .map(([currency, totalAnnualEstimate]) => ({ currency, totalAnnualEstimate }))
    .sort((a, b) => a.currency.localeCompare(b.currency))

  const knownCurrencies = totalsByCurrency.filter(({ currency }) => currency !== 'UNKNOWN')
  const isMultiCurrency = knownCurrencies.length > 1
  const totalAnnualEstimate =
    totalsByCurrency.length === 1 ? totalsByCurrency[0].totalAnnualEstimate : null

  const allProjected = dividendPositions.flatMap((p) => p.projected)
  const bestMonth = isMultiCurrency ? null : findBestMonth(allProjected)

  const yieldsWithValue = dividendPositions.filter((p) => p.yieldOnCost > 0)
  const avgYieldOnCost =
    yieldsWithValue.length > 0
      ? yieldsWithValue.reduce((sum, p) => sum + p.yieldOnCost, 0) / yieldsWithValue.length
      : 0

  return NextResponse.json(
    {
      positions: dividendPositions,
      totalAnnualEstimate,
      totalsByCurrency,
      isMultiCurrency,
      bestMonth,
      avgYieldOnCost,
      warnings: [
        ...warnings,
        ...(skippedTickers.size > 0
          ? [
              `Certaines lignes ont été ignorées car FMP a limité les requêtes: ${[...skippedTickers]
                .sort((a, b) => a.localeCompare(b))
                .join(', ')}.`,
            ]
          : []),
      ],
      skippedTickers: [...skippedTickers].sort((a, b) => a.localeCompare(b)),
    },
    { status: 200 },
  )
}
