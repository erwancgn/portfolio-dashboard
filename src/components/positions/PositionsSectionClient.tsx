'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AddPositionForm from './AddPositionForm'
import TrashDrawer from './TrashDrawer'

const REFRESH_INTERVAL_MS = 60_000

/**
 * PositionsSectionClient — Client Component.
 * Gère le polling auto 60s + le bouton d'ouverture de la modale d'ajout + la corbeille.
 */
export default function PositionsSectionClient() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [trashOpen, setTrashOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [router])

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          + Nouvelle position
        </button>
        <button
          onClick={() => setTrashOpen(true)}
          className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-secondary)]"
          title="Corbeille"
        >
          🗑
        </button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-card max-w-lg border-[var(--color-border)] bg-[var(--color-bg-primary)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text)]">Nouvelle position</DialogTitle>
          </DialogHeader>
          <AddPositionForm onPositionAdded={() => { setOpen(false); router.refresh() }} />
        </DialogContent>
      </Dialog>
      <TrashDrawer open={trashOpen} onClose={() => setTrashOpen(false)} />
    </>
  )
}
