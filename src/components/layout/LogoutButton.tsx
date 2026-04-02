'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Bouton de déconnexion — client component
 * Séparé de la page dashboard (Server Component)
 */
export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer whitespace-nowrap rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-sm font-medium text-[var(--color-text-sub)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text)]">
      <span className="hidden sm:inline">Se déconnecter</span>
      <span className="sm:hidden">←</span>
    </button>
  )
}
