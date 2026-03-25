'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AddPositionForm from './AddPositionForm'

/** Intervalle de rafraîchissement automatique des prix (en ms) */
const REFRESH_INTERVAL_MS = 60_000

/**
 * Wrapper client pour le formulaire d'ajout.
 * - Appelle router.refresh() après un ajout pour forcer le rechargement
 *   des Server Components enfants (PositionsTable).
 * - Rafraîchit automatiquement les prix toutes les 60 secondes via
 *   un setInterval, sans rechargement complet de page.
 */
export default function PositionsSectionClient() {
  const router = useRouter()

  useEffect(() => {
    const intervalId = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, [router])

  return (
    <AddPositionForm onPositionAdded={() => router.refresh()} />
  )
}
