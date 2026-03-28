'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AddBuyButtonProps {
  id: string
  ticker: string
}

/**
 * AddBuyButton — Client Component.
 * Affiche un mini-formulaire inline pour ajouter un achat sur une position existante.
 * Le recalcul du PRU est délégué au serveur (PATCH /api/positions/[id]).
 * Rafraîchit la page après succès via router.refresh().
 */
export default function AddBuyButton({ id, ticker }: AddBuyButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')

  function handleOpen() {
    setOpen(true)
    setErrorMsg(null)
    setQuantity('')
    setPurchasePrice('')
  }

  function handleCancel() {
    setOpen(false)
    setErrorMsg(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const qty = parseFloat(quantity)
    const price = parseFloat(purchasePrice)

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      setErrorMsg('Quantité et prix doivent être des nombres strictement positifs')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/positions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, purchasePrice: price }),
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
        return
      }

      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur lors de la mise à jour')
    } catch {
      setErrorMsg('Erreur réseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label={`Ajouter un achat sur ${ticker}`}
        className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
      >
        + Achat
      </button>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form onSubmit={handleSubmit} className="flex flex-col items-end gap-1">
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Quantité"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={loading}
          required
          aria-label="Quantité achetée"
          className="w-24 text-xs px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:border-blue-500"
        />
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Prix d'achat"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          disabled={loading}
          required
          aria-label="Prix d'achat"
          className="w-24 text-xs px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="text-xs text-blue-500 hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Enregistrement…' : 'Valider'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="text-xs text-[var(--color-text-sub)] hover:text-[var(--color-text)] disabled:opacity-40 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
      <Dialog open={errorMsg !== null} onOpenChange={(open) => { if (!open) setErrorMsg(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erreur lors de l&apos;achat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[var(--color-text-sub)]">{errorMsg}</p>
          <div className="flex justify-end">
            <button
              onClick={() => setErrorMsg(null)}
              className="text-sm px-4 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-surface)] transition-colors"
            >
              Fermer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
