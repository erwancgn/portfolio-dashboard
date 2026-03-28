'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/**
 * DepositButton — Client Component.
 * Permet un apport ou retrait manuel sur une enveloppe.
 * Appelle POST /api/liquidities puis rafraîchit la page via router.refresh().
 */
export default function DepositButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit')
  const [envelope, setEnvelope] = useState('PEA')
  const [amount, setAmount] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Montant invalide')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/liquidities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envelope, amount: amt, type }),
      })
      if (res.ok) {
        setOpen(false)
        setAmount('')
        router.refresh()
        return
      }
      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur')
    } catch {
      setErrorMsg('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-sub)] transition-colors"
      >
        + Apport
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm bg-[var(--color-bg-primary)] border-[var(--color-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--color-text)]">Apport / Retrait</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="flex gap-2">
              {(['deposit', 'withdraw'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    type === t
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-sub)] hover:bg-[var(--color-bg-surface)]'
                  }`}
                >
                  {t === 'deposit' ? 'Apport' : 'Retrait'}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">Enveloppe</label>
              <select
                value={envelope}
                onChange={(e) => setEnvelope(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              >
                <option value="PEA">PEA</option>
                <option value="CTO">CTO</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-sub)] uppercase tracking-wide">Montant (€)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                disabled={loading}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            {errorMsg && <p className="text-xs text-[var(--color-red-text)]">{errorMsg}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-40 transition-colors"
            >
              {loading ? 'Enregistrement…' : 'Confirmer'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
