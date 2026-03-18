import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/layout/LogoutButton'

/**
 * Page dashboard principale — Server Component
 * Protegee par proxy.ts — redirect vers /auth/login si non connecte
 */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen p-10" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--color-text)' }}>
              Portfolio Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-sub)' }}>
              {user?.email}
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="rounded-xl p-6"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)'
          }}>
          <p className="text-sm" style={{ color: 'var(--color-text-sub)' }}>
            Dashboard en construction — les positions arrivent bientot.
          </p>
        </div>
      </div>
    </div>
  )
}