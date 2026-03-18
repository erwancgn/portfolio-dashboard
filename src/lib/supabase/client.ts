import { createBrowserClient } from '@supabase/ssr'

/**
 * Client Supabase pour le navigateur (côté client)
 * Utilise la clé publique ANON_KEY — limitée par RLS
 * À utiliser dans les composants React (use client)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}