import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import TransactionsTable from '@/components/transactions/TransactionsTable'

/**
 * HistoriquePage — Server Component.
 * Affiche l'historique des transactions de l'utilisateur connecté,
 * triées par date décroissante. Redirige vers /auth/login si non authentifié.
 */
export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, ticker, type, quantity, price, total, tax_amount, executed_at')
    .eq('user_id', user.id)
    .order('executed_at', { ascending: false })

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
            <span className="font-bold text-[var(--color-text)] tracking-tight">Historique</span>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <TransactionsTable transactions={transactions ?? []} />
      </main>
    </div>
  )
}
