import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import VersionBadge from '@/components/layout/VersionBadge'
import PositionsSectionClient from '@/components/positions/PositionsSectionClient'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'
import LiquidityWidget from '@/components/portfolio/LiquidityWidget'
import PerformanceSection from '@/components/portfolio/PerformanceSection'
import PositionsTable from '@/components/positions/PositionsTable'

/**
 * Page dashboard principale — Server Component.
 * Protégée par proxy.ts — redirect vers /auth/login si non connecté.
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const safePositions = positions ?? []

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)]/80 bg-[color:color-mix(in_srgb,var(--color-bg-primary)_86%,white_14%)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 shrink-0">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                Portfolio Control
              </p>
              <span className="font-semibold tracking-tight text-[var(--color-text)]">Portfolio</span>
            </div>
            <VersionBadge />
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard/analyse"
              className="whitespace-nowrap text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              Analyse
            </Link>
            <Link
              href="/dashboard/historique"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors whitespace-nowrap"
            >
              Historique
            </Link>
            <Link
              href="/dashboard/dividendes"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors whitespace-nowrap"
            >
              Dividendes
            </Link>
            <Link
              href="/dashboard/fiscal"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors whitespace-nowrap"
            >
              Fiscalité
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="glass-card overflow-hidden rounded-[28px]">
          <div className="grid gap-5 px-5 py-5 sm:px-7 sm:py-6 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-text-sub)]">
                Overview
              </div>
              <div className="space-y-2">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
                  Une vue de portefeuille plus calme, plus dense et plus directement exploitable.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-sub)] sm:text-base">
                  Performance, liquidités, positions et fair value sur une même lecture, avec un rendu mobile plus clair et un langage visuel plus proche d’un produit d’investissement.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Positions</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{safePositions.length}</p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">Lignes actives</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Analyse</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">IA</p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">Radar, fair value, Buffett/Lynch</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero */}
        <PortfolioSummary positions={safePositions} />

        {/* Performance et heatmap */}
        <PerformanceSection positions={safePositions} userId={user.id} />

        {/* Liquidités */}
        <LiquidityWidget />

        {/* Tableau positions */}
        <section className="glass-card rounded-[28px] px-4 py-4 sm:px-5 sm:py-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
                Exécution
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">Mes positions</h2>
            </div>
            <PositionsSectionClient />
          </div>
          <PositionsTable positions={safePositions} />
        </section>
      </main>
    </div>
  )
}
