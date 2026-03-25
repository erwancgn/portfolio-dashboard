/**
 * EnvironmentBanner — affiche un bandeau orange en développement local.
 * Invisible en production (Vercel + main).
 *
 * Environnements :
 *   - Dev  : http://localhost:3000        → bandeau orange "DEV — local"
 *   - Prod : portfolio-zeta-fawn-73.vercel.app → rien affiché
 */
export default function EnvironmentBanner() {
  const isProd = process.env.VERCEL_ENV === 'production'

  if (isProd) return null

  return (
    <div className="w-full px-4 py-2 text-center text-xs font-semibold tracking-wide bg-orange-500 text-white">
      DEV — Supabase local
    </div>
  )
}
