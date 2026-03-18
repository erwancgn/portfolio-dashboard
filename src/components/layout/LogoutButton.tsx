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
      className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
      style={{
        backgroundColor: 'var(--color-red-bg)',
        border: '1px solid var(--color-red)',
        color: 'var(--color-red-text)'
      }}>
      Se déconnecter
    </button>
  )
}