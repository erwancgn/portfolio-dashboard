import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Page dashboard principale
 * Protegee par proxy.ts — redirect vers /auth/login si non connecte
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div style={{ backgroundColor: 'var(--color-bg-primary)', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ color: 'var(--color-text)', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Portfolio Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-sub)', marginBottom: 32 }}>
          Connecte en tant que : {user.email}
        </p>
        <div style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 12, padding: 24
        }}>
          <p style={{ color: 'var(--color-text-sub)', fontSize: 14 }}>
            Dashboard en construction — les positions arrivent bientot.
          </p>
        </div>
      </div>
    </div>
  )
}