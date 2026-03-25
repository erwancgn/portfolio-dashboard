import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'
import PositionsSectionClient from '@/components/positions/PositionsSectionClient'
import PositionsTable from '@/components/positions/PositionsTable'
import PortfolioSummary from '@/components/portfolio/PortfolioSummary'
import PnlStats from '@/components/portfolio/PnlStats'

/**
 * Page dashboard principale — Server Component
 * Protegee par proxy.ts — redirect vers /auth/login si non connecte
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen p-10 bg-[var(--color-bg-primary)]">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1 text-[var(--color-text)]">
              Portfolio Dashboard
            </h1>
            <p className="text-sm text-[var(--color-text-sub)]">
              {user?.email}
            </p>
          </div>
          <LogoutButton />
        </div>

        <PortfolioSummary />

        <PnlStats />

        <div className="rounded-xl p-6 mb-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <PositionsSectionClient />
        </div>

        <div className="rounded-xl p-6 bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Mes positions
          </h2>
          <PositionsTable />
        </div>
      </div>
    </div>
  )
}