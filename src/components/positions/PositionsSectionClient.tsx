'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AddPositionForm from './AddPositionForm'

const REFRESH_INTERVAL_MS = 60_000

/**
 * PositionsSectionClient — Client Component.
 * Gère le polling auto 60s + le bouton d'ouverture de la modale d'ajout.
 */
export default function PositionsSectionClient() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        + Nouvelle position
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card max-w-lg border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text)]">Nouvelle position</DialogTitle>
          </DialogHeader>
          <AddPositionForm onPositionAdded={() => { setOpen(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
    </>
  )
}
