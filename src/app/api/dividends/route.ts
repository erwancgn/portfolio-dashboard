/**
 * GET /api/dividends
 * Retourne pour chaque position de l'utilisateur :
 * - Historique réel des dividendes (FMP)
 * - Projections sur 12 mois glissants
 * - Yield on cost calculé avec le PRU Supabase
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchTickerDividends } from '@/lib/fmp-dividends'
import type { Tables } from '@/types/database'

type Position = Tables<'positions'>

/** Résumé d'une position avec ses données dividendes */
export interface PositionDividendSummary {
  ticker: string
  name: string | null
  quantity: number
  pru: number
  envelope: string | null
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
  totalAnnualEstimate: number
  bestMonth: string | null
  avgYieldOnCost: number
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

/**
 * GET /api/dividends
 * Auth requise. Fetche FMP en parallèle pour toutes les positions equity.
 * Les ETF et crypto sont filtrés silencieusement si FMP ne retourne rien.
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
    .select('id, ticker, name, quantity, pru, envelope, type')
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
    'id' | 'ticker' | 'name' | 'quantity' | 'pru' | 'envelope' | 'type'
  >[]

  // Fetch FMP en parallèle pour toutes les positions
  const results = await Promise.allSettled(
    safePositions.map(async (pos) => {
      const data = await fetchTickerDividends(pos.ticker)
      return { pos, data }
    }),
  )

  const dividendPositions: PositionDividendSummary[] = []

  for (const result of results) {
    if (result.status !== 'fulfilled') continue
    const { pos, data } = result.value
    if (!data) continue // Pas de dividende pour ce ticker

    const annualTotal = data.annualDividendPerShare * pos.quantity
    const yieldOnCost =
      pos.pru > 0 ? (data.annualDividendPerShare / pos.pru) * 100 : 0

    dividendPositions.push({
      ticker: pos.ticker,
      name: pos.name,
      quantity: pos.quantity,
      pru: pos.pru,
      envelope: pos.envelope,
      frequency: data.frequency,
      annualDividendPerShare: data.annualDividendPerShare,
      annualDividendTotal: annualTotal,
      yieldOnCost,
      history: data.history.slice(0, 20).map((h) => ({
        date: h.date,
        amount: h.amount,
        total: h.amount * pos.quantity,
        paymentDate: h.paymentDate,
      })),
      projected: data.projected.map((p) => ({
        date: p.date,
        amount: p.amount,
        total: p.amount * pos.quantity,
      })),
    })
  }

  const totalAnnualEstimate = dividendPositions.reduce(
    (sum, p) => sum + p.annualDividendTotal,
    0,
  )

  const allProjected = dividendPositions.flatMap((p) => p.projected)
  const bestMonth = findBestMonth(allProjected)

  const yieldsWithValue = dividendPositions.filter((p) => p.yieldOnCost > 0)
  const avgYieldOnCost =
    yieldsWithValue.length > 0
      ? yieldsWithValue.reduce((sum, p) => sum + p.yieldOnCost, 0) / yieldsWithValue.length
      : 0

  return NextResponse.json(
    { positions: dividendPositions, totalAnnualEstimate, bestMonth, avgYieldOnCost },
    { status: 200 },
  )
}
