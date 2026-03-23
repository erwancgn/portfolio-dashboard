'use client'

import { useRouter } from 'next/navigation'
import AddPositionForm from './AddPositionForm'

/**
 * Wrapper client pour le formulaire d'ajout.
 * Appelle router.refresh() après un ajout pour forcer le rechargement
 * des Server Components enfants (PositionsTable).
 */
export default function PositionsSectionClient() {
  const router = useRouter()

  return (
    <AddPositionForm onPositionAdded={() => router.refresh()} />
  )
}
