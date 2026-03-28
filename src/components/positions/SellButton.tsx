'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface SellButtonProps {
  id: string
  ticker: string
  maxQuantity: number
  pru: number
  envelope: string | null
}

/**
 * SellButton — Client Component.
 * Affiche un mini-formulaire inline pour vendre tout ou partie d'une position.
 * La vente est atomique via POST /api/positions/[id]/sell (RPC sell_position).
 * Si vente totale, la position est supprimée. Rafraîchit via router.refresh().
 */
export default function SellButton({ id, ticker, maxQuantity, pru, envelope }: SellButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [quantity, setQuantity] = useState('')
  const [salePrice, setSalePrice] = useState('')

  function handleOpen() {
    setOpen(true)
    setErrorMsg(null)
    setQuantity('')
    setSalePrice('')
  }

  function handleCancel() {
    setOpen(false)
    setErrorMsg(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const qty = parseFloat(quantity)
    const price = parseFloat(salePrice)

    if (isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      setErrorMsg('Quantité et prix doivent être des nombres strictement positifs')
      return
    }

    if (qty > maxQuantity) {
      setErrorMsg(`Quantité maximale disponible : ${maxQuantity}`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/positions/${id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty, salePrice: price }),
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
        return
      }

      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur lors de la vente')
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
        aria-label={`Vendre ${ticker}`}
        className="text-xs font-medium px-2 py-1 rounded border border-[var(--color-red)] text-[var(--color-red-text)] hover:bg-[var(--color-red-bg)] transition-colors"
      >
        Vendre
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
          max={maxQuantity}
          placeholder="Quantité"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={loading}
          required
          aria-label="Quantité vendue"
          className="w-24 text-xs px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:border-[var(--color-red)]"
        />
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Prix de vente"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
          disabled={loading}
          required
          aria-label="Prix de vente"
          className="w-24 text-xs px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:border-[var(--color-red)]"
        />
        {(() => {
          const qty = parseFloat(quantity)
          const price = parseFloat(salePrice)
          const hasPreview = !isNaN(qty) && qty > 0 && !isNaN(price) && price > 0
          const gain = hasPreview ? (price - pru) * qty : null
          const isGainVal = gain !== null && gain >= 0
          const isPea = envelope === 'PEA'
          const tax = gain !== null && !isPea ? Math.max(0, gain) * 0.30 : 0
          const net = hasPreview ? price * qty - tax : null
          return hasPreview && gain !== null ? (
            <div className="text-xs tabular-nums space-y-0.5 text-right border-t border-[var(--color-border)] pt-1">
              <p className={isGainVal ? 'text-[var(--color-green-text)]' : 'text-[var(--color-red-text)]'}>
                P&L : {isGainVal ? '+' : ''}{gain.toFixed(2)} €
              </p>
              {!isPea && tax > 0 && (
                <p className="text-[var(--color-text-sub)]">Taxe 30% : -{tax.toFixed(2)} €</p>
              )}
              {isPea && (
                <p className="text-[var(--color-text-sub)]">PEA — exonéré</p>
              )}
              <p className="font-semibold text-[var(--color-text)]">Net : {net!.toFixed(2)} €</p>
            </div>
          ) : null
        })()}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="text-xs text-[var(--color-red-text)] hover:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
            <DialogTitle>Erreur lors de la vente</DialogTitle>
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
