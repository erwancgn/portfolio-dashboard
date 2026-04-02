/**
 * Récupération des données financières fondamentales via FMP.
 * Utilisé pour injecter un contexte de données réelles dans les agents IA.
 */

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

/**
 * Récupère et formate les données financières réelles d'un actif via FMP.
 * Appelle en parallèle : /stable/quote, /stable/key-metrics, /stable/income-statement.
 * Retourne un bloc markdown structuré à injecter dans le prompt Gemini.
 * Retourne une chaîne vide si FMP_API_KEY est absente ou en cas d'erreur.
 *
 * @param ticker - Symbole boursier (ex: AAPL, MC.PA)
 */
export async function fetchFmpFinancialContext(ticker: string): Promise<string> {
  const apiKey = process.env.FMP_API_KEY
  if (!apiKey) return ''

  const base = 'https://financialmodelingprep.com'
  const sym = encodeURIComponent(ticker)
  const opts = { cache: 'no-store' as const }

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
      '---',
      '## 📊 DONNÉES FINANCIÈRES RÉELLES — Source : FMP (données en temps réel)',
      `> Ticker analysé : **${ticker.toUpperCase()}** — données fraîches du ${new Date().toLocaleDateString('fr-FR')}`,
    ]

    // --- Cours en direct ---
    if (quote) {
      lines.push('\n### Cours en direct')
      lines.push(`| Info | Valeur |`)
      lines.push(`|------|--------|`)
      lines.push(`| **Cours actuel** | **${n(quote.price, 2)}** |`)
      lines.push(`| Variation journée | ${n(quote.changesPercentage, 2, '%')} |`)
      lines.push(`| Plus haut 52 sem. | ${n(quote.yearHigh, 2)} |`)
      lines.push(`| Plus bas 52 sem. | ${n(quote.yearLow, 2)} |`)
      lines.push(`| Moyenne 50j | ${n(quote.priceAvg50, 2)} |`)
      lines.push(`| Moyenne 200j | ${n(quote.priceAvg200, 2)} |`)
      lines.push(`| P/E actuel | ${n(quote.pe, 1)} |`)
      lines.push(`| EPS (TTM) | ${n(quote.eps, 2)} |`)
      lines.push(`| Capitalisation | ${bn(quote.marketCap)} |`)
    } else {
      lines.push('\n> ⚠️ Cours en direct non disponible via FMP.')
    }

    // --- Métriques fondamentales ---
    if (metrics.length > 0) {
      const latest = metrics[0]
      lines.push(`\n### Métriques fondamentales (exercice ${latest.date?.slice(0, 4) ?? 'N/A'})`)
      lines.push(`| Métrique | Valeur |`)
      lines.push(`|----------|--------|`)
      lines.push(`| **ROIC** | ${pct(latest.roic)} |`)
      lines.push(`| **ROE** | ${pct(latest.roe)} |`)
      lines.push(`| **FCF par action** | ${n(latest.freeCashFlowPerShare, 2)} |`)
      lines.push(`| **FCF Yield** | ${pct(latest.freeCashFlowYield)} |`)
      lines.push(`| **EV/EBITDA** | ${n(latest.evToEbitda, 1)} |`)
      lines.push(`| **P/B ratio** | ${n(latest.pbRatio, 1)} |`)
      lines.push(`| **P/E (annuel)** | ${n(latest.peRatio, 1)} |`)
      lines.push(`| **Dette nette / EBITDA** | ${n(latest.netDebtToEBITDA, 2)} |`)
      lines.push(`| **Dette / Fonds propres** | ${pct(latest.debtToEquity)} |`)
      lines.push(`| **Current ratio** | ${n(latest.currentRatio, 2)} |`)
      lines.push(`| **Couverture intérêts** | ${n(latest.interestCoverage, 1)}× |`)
      lines.push(`| **Cash net par action** | ${n(latest.netCashPerShare, 2)} |`)
      lines.push(`| **Rendement dividende** | ${pct(latest.dividendYield)} |`)

      // ROIC moyen sur N années
      const roics = metrics
        .map(m => m.roic)
        .filter((v): v is number => v != null)
      if (roics.length >= 2) {
        const avg = (roics.reduce((s, v) => s + v, 0) / roics.length) * 100
        lines.push(`| **ROIC moyen ${roics.length} ans** | ${avg.toFixed(1)}% |`)
      }
    }

    // --- Historique des résultats ---
    if (incomes.length >= 2) {
      lines.push('\n### Historique des résultats (5 exercices)')
      lines.push(`| Exercice | CA | Marge brute | Marge opé. | Marge nette | EPS |`)
      lines.push(`|----------|-----|------------|------------|-------------|-----|`)
      for (const inc of incomes) {
        const year = inc.date?.slice(0, 4) ?? 'N/A'
        lines.push(
          `| ${year} | ${bn(inc.revenue)} | ${pct(inc.grossProfitRatio)} | ${pct(inc.operatingIncomeRatio)} | ${pct(inc.netIncomeRatio)} | ${n(inc.epsDiluted ?? inc.eps, 2)} |`,
        )
      }

      // CAGR EPS
      const validEps = incomes
        .map(i => i.epsDiluted ?? i.eps)
        .filter((v): v is number => v != null && v > 0)
      if (validEps.length >= 2) {
        const cagrEps = (Math.pow(validEps[0] / validEps[validEps.length - 1], 1 / (validEps.length - 1)) - 1) * 100
        lines.push(`\n**CAGR EPS (${validEps.length - 1} ans)** : ${cagrEps.toFixed(1)}%/an`)
      }

      // CAGR Chiffre d'affaires
      const validRev = incomes
        .map(i => i.revenue)
        .filter((v): v is number => v != null && v > 0)
      if (validRev.length >= 2) {
        const cagrRev = (Math.pow(validRev[0] / validRev[validRev.length - 1], 1 / (validRev.length - 1)) - 1) * 100
        lines.push(`**CAGR CA (${validRev.length - 1} ans)** : ${cagrRev.toFixed(1)}%/an`)
      }
    }

    lines.push('---')
    return lines.join('\n')
  } catch (err) {
    console.error('[fmp-financials] fetchFmpFinancialContext error:', err)
    return ''
  }
}
