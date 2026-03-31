import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import AllocationSection from '@/components/portfolio/AllocationSection'
import ChatIA from '@/components/analyse/ChatIA'
import QuickAnalysis from '@/components/analyse/QuickAnalysis'

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

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors"
            >
              ← Retour
            </Link>
            <span className="font-bold text-[var(--color-text)] tracking-tight">
              Analyse
            </span>
          </div>
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
        {/* Allocation par enveloppe / secteur */}
        <AllocationSection positions={positions ?? []} />

        {/* Analyse rapide d'un titre */}
        <QuickAnalysis />

        {/* Chat IA Claude */}
        <ChatIA />
      </main>
    </div>
  )
}
