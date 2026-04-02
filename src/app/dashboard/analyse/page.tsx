import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import AllocationSection from '@/components/portfolio/AllocationSection'
import ChatIA from '@/components/analyse/ChatIA'
import AssetAnalysisTabs from '@/components/analyse/AssetAnalysisTabs'

/**
 * AnalysePage — Server Component.
 * Page d'analyse du portfolio : graphiques d'allocation + chat IA Claude.
 * Protégée par proxy.ts — redirect vers /auth/login si non connecté.
 */
export default async function AnalysePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .order('created_at', { ascending: false })

  const safePositions = positions ?? []
  const invested = safePositions.reduce((sum, pos) => sum + pos.quantity * pos.pru, 0)
  const withPrice = safePositions.filter((pos) => pos.current_price != null)
  const current = safePositions.reduce(
    (sum, pos) => sum + pos.quantity * (pos.current_price ?? pos.pru),
    0,
  )
  const performance = current - invested

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)]/80 bg-[color:color-mix(in_srgb,var(--color-bg-primary)_86%,white_14%)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1 text-sm text-[var(--color-text-sub)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]"
            >
              ← Retour
            </Link>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                Intelligence Portfolio
              </p>
              <span className="font-semibold tracking-tight text-[var(--color-text)]">
                Analyse
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard/historique"
              className="text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              Historique
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="glass-card overflow-hidden rounded-[28px]">
          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-text-sub)]">
                Radar IA
              </div>
              <div className="space-y-2">
                <h1 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
                  Une vue d’analyse plus proche d’un cockpit d’investissement que d’un simple dashboard.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-sub)] sm:text-base">
                  Analyse rapide, fair value, lecture Buffett/Lynch et assistant portfolio dans une interface plus dense, plus calme et plus actionnable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 data-grid">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Positions</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">{safePositions.length}</p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">{withPrice.length} avec prix live</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Valeur</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(current)} €
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">Estimation actuelle</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Investi</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
                  {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(invested)} €
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">Base PRU</p>
              </div>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-dim)]">Performance</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${performance >= 0 ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'}`}>
                  {performance >= 0 ? '+' : ''}
                  {new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(performance)} €
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-sub)]">Mark-to-market</p>
              </div>
            </div>
          </div>
        </section>

        {/* Allocation par enveloppe / secteur */}
        <AllocationSection positions={safePositions} />

        {/* Analyse rapide + Fair value (onglets) */}
        <AssetAnalysisTabs />

        {/* Chat IA Claude */}
        <ChatIA />
      </main>
    </div>
  )
}
