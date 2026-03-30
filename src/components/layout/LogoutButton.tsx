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
      className="px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] hover:border-[var(--color-text-sub)] transition-colors whitespace-nowrap">
      <span className="hidden sm:inline">Se déconnecter</span>
      <span className="sm:hidden">←</span>
    </button>
  )
}