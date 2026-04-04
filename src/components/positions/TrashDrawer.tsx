'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface TrashedPosition {
  id: string
  ticker: string
  name: string | null
  quantity: number
  pru: number
  envelope: string | null
  deleted_at: string | null
}

interface TrashDrawerProps {
  open: boolean
  onClose: () => void
}

/**
 * TrashDrawer — Vue corbeille des positions soft-deleted.
 * Permet de restaurer individuellement ou vider définitivement.
 */
export default function TrashDrawer({ open, onClose }: TrashDrawerProps) {
  const router = useRouter()
  // null = pas encore chargé (loading), [] = chargé vide
  const [positions, setPositions] = useState<TrashedPosition[] | null>(null)
  const [confirmPurge, setConfirmPurge] = useState(false)

  const loading = open && positions === null

  useEffect(() => {
    if (!open) return
    fetch('/api/positions/trash')
      .then((r) => r.json())
      .then((data) => setPositions(Array.isArray(data) ? data : []))
  }, [open])

  async function handleRestore(id: string) {
    await fetch(`/api/positions/${id}/restore`, { method: 'POST' })
    setPositions((prev) => (prev ?? []).filter((p) => p.id !== id))
    router.refresh()
  }

  async function handlePurge() {
    await fetch('/api/positions/trash', { method: 'DELETE' })
    setPositions([])
    setConfirmPurge(false)
    router.refresh()
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPositions(null); setConfirmPurge(false); onClose() } }}>
      <DialogContent className="glass-card max-w-lg border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text)]">Corbeille</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">Chargement…</p>
        )}

        {!loading && positions !== null && positions.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">La corbeille est vide.</p>
        )}

        {!loading && positions !== null && positions.length > 0 && (
          <>
            <ul className="divide-y divide-[var(--color-border)]">
              {positions.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">{p.ticker}</span>
                      {p.name && (
                        <span className="text-sm text-[var(--color-text-muted)]">{p.name}</span>
                      )}
                      {p.envelope && (
                        <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">{p.envelope}</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {p.quantity} × {p.pru.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} · Supprimé le {formatDate(p.deleted_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(p.id)}
                    className="rounded px-3 py-1 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    Restaurer
                  </button>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              {!confirmPurge ? (
                <button
                  onClick={() => setConfirmPurge(true)}
                  className="w-full rounded px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Vider la corbeille
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handlePurge}
                    className="flex-1 rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                  >
                    Confirmer la suppression définitive
                  </button>
                  <button
                    onClick={() => setConfirmPurge(false)}
                    className="rounded px-4 py-2 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
