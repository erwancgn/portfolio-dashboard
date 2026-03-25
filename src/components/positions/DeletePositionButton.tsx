'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePositionButtonProps {
  id: string
  ticker: string
}

/**
 * DeletePositionButton — Client Component.
 * Demande confirmation puis supprime la position via DELETE /api/positions/[id].
 * Rafraîchit la page après succès via router.refresh().
 */
export default function DeletePositionButton({ id, ticker }: DeletePositionButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleDelete() {
    const confirmed = window.confirm(`Supprimer la position ${ticker} ?`)
    if (!confirmed) return

    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/positions/${id}`, { method: 'DELETE' })

      if (res.status === 204) {
        router.refresh()
        return
      }

      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur lors de la suppression')
    } catch {
      setErrorMsg('Erreur réseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={loading}
        aria-label={`Supprimer la position ${ticker}`}
        className="text-xs text-red-500 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Suppression…' : 'Supprimer'}
      </button>
      {errorMsg && (
        <span className="text-xs text-red-500">{errorMsg}</span>
      )}
    </div>
  )
}
