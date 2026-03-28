import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import PositionsSectionClient from '@/components/positions/PositionsSectionClient'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'
import PnlStats from '@/components/portfolio/PnlStats'
import LiquidityWidget from '@/components/portfolio/LiquidityWidget'
import AllocationSection from '@/components/portfolio/AllocationSection'
import AnalyseSection from '@/components/portfolio/AnalyseSection'
import PositionsTable from '@/components/positions/PositionsTable'

/**
 * Page dashboard principale — Server Component.
 * Protégée par proxy.ts — redirect vers /auth/login si non connecté.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-bold text-[var(--color-text)] tracking-tight">Portfolio</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard/historique"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors"
            >
              Historique
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <PortfolioSummary />

        {/* Stats P&L */}
        <PnlStats />

        {/* Allocation par enveloppe / secteur */}
        <AllocationSection />

        {/* Analyse : Poids / Secteur / Pays */}
        <AnalyseSection />

        {/* Liquidités */}
        <LiquidityWidget />

        {/* Tableau positions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Mes positions</h2>
            <PositionsSectionClient />
          </div>
          <PositionsTable />
        </section>
      </main>
    </div>
  )
}
