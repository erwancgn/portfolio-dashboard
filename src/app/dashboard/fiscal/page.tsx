import Link from 'next/link'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'
import FiscalReport from '@/components/fiscal/FiscalReport'
import DemoBootstrapPanel from '@/components/fiscal/DemoBootstrapPanel'
import TradeRepublicImportPanel from '@/components/fiscal/TradeRepublicImportPanel'
import { createClient } from '@/lib/supabase/server'
import {
  buildFiscalReport,
  fetchFiscalTransactions,
  fetchFiscalYears,
} from '@/lib/fiscal'
import { fetchBrokerImportDigest } from '@/lib/trade-republic'

function parseFiscalYear(rawYear: string | undefined, availableYears: number[]) {
  const currentYear = new Date().getUTCFullYear()
  const fallbackYear = availableYears[0] ?? currentYear

  if (!rawYear) return fallbackYear

  const year = Number(rawYear)
  if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
    return fallbackYear
  }

  return year
}

export default async function FiscalPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const supabase = await createClient()
  const [{ data: auth }, resolvedSearchParams] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
  ])

  if (!auth.user) redirect('/auth/login')

  const years = await fetchFiscalYears(supabase, auth.user.id)
  const year = parseFiscalYear(resolvedSearchParams.year, years)
  const [transactions, brokerDigest] = await Promise.all([
    fetchFiscalTransactions(supabase, auth.user.id, year),
    fetchBrokerImportDigest(supabase, auth.user.id, year),
  ])
  const report = buildFiscalReport(year, transactions)
  const hasData = transactions.length > 0 || brokerDigest.summary.documentCount > 0

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)]/80 bg-[color:color-mix(in_srgb,var(--color-bg-primary)_86%,white_14%)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              ← Retour
            </Link>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                Compliance
              </p>
              <span className="font-semibold tracking-tight text-[var(--color-text)]">Fiscalité</span>
            </div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard/historique"
              className="whitespace-nowrap text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              Historique
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-6">
          {process.env.NODE_ENV !== 'production' && <DemoBootstrapPanel hasData={hasData} />}
          <TradeRepublicImportPanel hasImports={brokerDigest.summary.documentCount > 0} />
          <FiscalReport report={report} years={years} brokerDigest={brokerDigest} />
        </div>
      </main>
    </div>
  )
}
