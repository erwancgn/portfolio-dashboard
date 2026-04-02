/**
 * Récupération des données financières fondamentales via FMP.
 * Utilisé pour injecter un contexte de données réelles dans les agents IA.
 */
import { readThroughTtlCache } from '@/lib/cache'

const FMP_FINANCIAL_CONTEXT_TTL_MS = 6 * 60 * 60 * 1000

/** Quote en temps réel retourné par FMP /stable/quote */
interface FmpQuoteRaw {
  symbol?: string
  price?: number
  pe?: number
  eps?: number
  marketCap?: number
  sharesOutstanding?: number
  yearHigh?: number
  yearLow?: number
  priceAvg50?: number
  priceAvg200?: number
  change?: number
  changesPercentage?: number
}

/** Métriques fondamentales annuelles retournées par FMP /stable/key-metrics */
interface FmpKeyMetricsRaw {
  date?: string
  roic?: number
  freeCashFlowPerShare?: number
  freeCashFlowYield?: number
  currentRatio?: number
  debtToEquity?: number
  netDebtToEBITDA?: number
  pbRatio?: number
  peRatio?: number
  evToEbitda?: number
  dividendYield?: number
  interestCoverage?: number
  netCashPerShare?: number
  roe?: number
  earningsYield?: number
  investedCapital?: number
}

/** Compte de résultat annuel retourné par FMP /stable/income-statement */
interface FmpIncomeRaw {
  date?: string
  revenue?: number
  grossProfit?: number
  grossProfitRatio?: number
  operatingIncome?: number
  operatingIncomeRatio?: number
  netIncome?: number
  netIncomeRatio?: number
  ebitda?: number
  eps?: number
  epsDiluted?: number
}

const n = (v: number | undefined, decimals = 1, unit = '') =>
  v != null ? `${v.toFixed(decimals)}${unit}` : 'N/A'

const pct = (v: number | undefined, decimals = 1) =>
  v != null ? `${(v * 100).toFixed(decimals)}%` : 'N/A'

const bn = (v: number | undefined) =>
  v != null ? `${(v / 1e9).toFixed(1)} Mds` : 'N/A'

function buildMetricLine(label: string, value: string): string {
  return `${label}: ${value}`
}

/**
 * Récupère et formate les données financières réelles d'un actif via FMP.
 * Appelle en parallèle : /stable/quote, /stable/key-metrics, /stable/income-statement.
 * Retourne un bloc texte compact à injecter dans le prompt Gemini.
 * Retourne une chaîne vide si FMP_API_KEY est absente ou en cas d'erreur.
 *
 * @param ticker - Symbole boursier (ex: AAPL, MC.PA)
 */
export async function fetchFmpFinancialContext(ticker: string): Promise<string> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) return ''

  return readThroughTtlCache(
    `fmp:financial-context:${ticker}`,
    FMP_FINANCIAL_CONTEXT_TTL_MS,
    async () => {
      const base = 'https://financialmodelingprep.com'
      const sym = encodeURIComponent(ticker)
      const opts = { next: { revalidate: 21600 } }

      try {
        const [quoteRes, metricsRes, incomeRes] = await Promise.allSettled([
          fetch(`${base}/stable/quote?symbol=${sym}&apikey=${apiKey}`, opts),
          fetch(`${base}/stable/key-metrics?symbol=${sym}&limit=5&apikey=${apiKey}`, opts),
          fetch(`${base}/stable/income-statement?symbol=${sym}&limit=5&apikey=${apiKey}`, opts),
        ])

        const quote: FmpQuoteRaw | null =
          quoteRes.status === 'fulfilled' && quoteRes.value.ok
            ? ((await quoteRes.value.json()) as FmpQuoteRaw[])[0] ?? null
            : null

        const metrics: FmpKeyMetricsRaw[] =
          metricsRes.status === 'fulfilled' && metricsRes.value.ok
            ? ((await metricsRes.value.json()) as FmpKeyMetricsRaw[])
            : []

        const incomes: FmpIncomeRaw[] =
          incomeRes.status === 'fulfilled' && incomeRes.value.ok
            ? ((await incomeRes.value.json()) as FmpIncomeRaw[])
            : []

        const lines: string[] = [
          `Contexte FMP pour ${ticker.toUpperCase()} (${new Date().toLocaleDateString('fr-FR')})`,
        ]

        if (quote) {
          lines.push(
            [
              'Cours temps réel',
              buildMetricLine('Prix', n(quote.price, 2)),
              buildMetricLine('Var jour', n(quote.changesPercentage, 2, '%')),
              buildMetricLine('P/E', n(quote.pe, 1)),
              buildMetricLine('EPS TTM', n(quote.eps, 2)),
              buildMetricLine('Capi', bn(quote.marketCap)),
              buildMetricLine('52w haut', n(quote.yearHigh, 2)),
              buildMetricLine('52w bas', n(quote.yearLow, 2)),
            ].join(' | '),
          )
        } else {
          lines.push('Cours temps réel: N/A')
        }

        if (metrics.length > 0) {
          const latest = metrics[0]
          lines.push(
            [
              `Fondamentaux ${latest.date?.slice(0, 4) ?? 'N/A'}`,
              buildMetricLine('ROIC', pct(latest.roic)),
              buildMetricLine('ROE', pct(latest.roe)),
              buildMetricLine('FCF/action', n(latest.freeCashFlowPerShare, 2)),
              buildMetricLine('FCF yield', pct(latest.freeCashFlowYield)),
              buildMetricLine('EV/EBITDA', n(latest.evToEbitda, 1)),
              buildMetricLine('P/B', n(latest.pbRatio, 1)),
              buildMetricLine('P/E annuel', n(latest.peRatio, 1)),
              buildMetricLine('Dette nette/EBITDA', n(latest.netDebtToEBITDA, 2)),
              buildMetricLine('Dette/Fonds propres', pct(latest.debtToEquity)),
              buildMetricLine('Current ratio', n(latest.currentRatio, 2)),
              buildMetricLine('Couverture intérêts', n(latest.interestCoverage, 1)),
              buildMetricLine('Cash net/action', n(latest.netCashPerShare, 2)),
              buildMetricLine('Dividende', pct(latest.dividendYield)),
            ].join(' | '),
          )

          const roics = metrics
            .map(m => m.roic)
            .filter((v): v is number => v != null)
          if (roics.length >= 2) {
            const avg = (roics.reduce((s, v) => s + v, 0) / roics.length) * 100
            lines.push(`ROIC moyen ${roics.length} ans: ${avg.toFixed(1)}%`)
          }
        }

        if (incomes.length >= 2) {
          const history = incomes
            .slice(0, 5)
            .map((inc) => {
              const year = inc.date?.slice(0, 4) ?? 'N/A'
              return `${year}: CA ${bn(inc.revenue)}, marge op ${pct(inc.operatingIncomeRatio)}, marge nette ${pct(inc.netIncomeRatio)}, EPS ${n(inc.epsDiluted ?? inc.eps, 2)}`
            })
            .join(' || ')
          lines.push(`Historique résultats: ${history}`)

          const validEps = incomes
            .map(i => i.epsDiluted ?? i.eps)
            .filter((v): v is number => v != null && v > 0)
          if (validEps.length >= 2) {
            const cagrEps = (Math.pow(validEps[0] / validEps[validEps.length - 1], 1 / (validEps.length - 1)) - 1) * 100
            lines.push(`CAGR EPS ${validEps.length - 1} ans: ${cagrEps.toFixed(1)}%/an`)
          }

          const validRev = incomes
            .map(i => i.revenue)
            .filter((v): v is number => v != null && v > 0)
          if (validRev.length >= 2) {
            const cagrRev = (Math.pow(validRev[0] / validRev[validRev.length - 1], 1 / (validRev.length - 1)) - 1) * 100
            lines.push(`CAGR CA ${validRev.length - 1} ans: ${cagrRev.toFixed(1)}%/an`)
          }
        }

        return lines.join('\n')
      } catch (err) {
        console.error('[fmp-financials] fetchFmpFinancialContext error:', err)
        return ''
      }
    },
  )
}
