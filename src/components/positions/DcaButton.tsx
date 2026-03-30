'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DcaButtonProps {
  positionId: string
  ticker: string
  hasActiveDca: boolean
  activeDcaId?: string
}

type Frequency = 'weekly' | 'biweekly' | 'monthly'

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Hebdomadaire',
  biweekly: 'Bimensuel',
  monthly: 'Mensuel',
}

const ENVELOPES = ['PEA', 'CTO', 'PER', 'Livret A']

/**
 * DcaButton — Client Component.
 * Ouvre un dialog pour créer ou désactiver une règle DCA sur une position.
 * La règle est stockée en DB via POST /api/dca.
 * Désactivation via DELETE /api/dca/[id].
 */
export default function DcaButton({
  positionId,
  ticker,
  hasActiveDca,
  activeDcaId,
}: DcaButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [nextDate, setNextDate] = useState('')
  const [envelope, setEnvelope] = useState('')

  function handleOpen() {
    setOpen(true)
    setErrorMsg(null)
    setAmount('')
    setFrequency('monthly')
    setNextDate('')
    setEnvelope('')
  }

  function handleClose() {
    setOpen(false)
    setErrorMsg(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Le montant doit être un nombre strictement positif')
      return
    }
    if (!nextDate) {
      setErrorMsg('La date de première exécution est obligatoire')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/dca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: positionId,
          ticker,
          amount: amountNum,
          frequency,
          next_expected_at: nextDate,
          envelope: envelope || undefined,
        }),
      })

      if (res.ok) {
        setOpen(false)
        router.refresh()
        return
      }

      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur lors de la création du DCA')
    } catch {
      setErrorMsg('Erreur réseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!activeDcaId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/dca/${activeDcaId}`, { method: 'DELETE' })
      if (res.ok) {
        setOpen(false)
        router.refresh()
        return
      }
      const body = (await res.json()) as { error?: string }
      setErrorMsg(body.error ?? 'Erreur lors de la désactivation')
    } catch {
      setErrorMsg('Erreur réseau, réessayez')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={`Programmer un DCA sur ${ticker}`}
        className={
          hasActiveDca
            ? 'text-xs font-medium px-2 py-1 rounded border border-[var(--color-green)] text-[var(--color-green-text)] bg-[var(--color-green-bg)] hover:opacity-80 transition-colors'
            : 'text-xs font-medium px-2 py-1 rounded border border-[var(--color-border)] text-[var(--color-text-sub)] hover:border-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors'
        }
      >
        {hasActiveDca ? 'DCA actif' : 'DCA'}
      </button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {hasActiveDca ? `DCA actif — ${ticker}` : `Programmer un DCA — ${ticker}`}
            </DialogTitle>
          </DialogHeader>

          {hasActiveDca ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-[var(--color-text-sub)]">
                Un DCA est déjà actif sur cette position. Vous pouvez le désactiver ci-dessous.
              </p>
              {errorMsg && (
                <p className="text-xs text-[var(--color-red-text)]">{errorMsg}</p>
              )}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-sm px-4 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] disabled:opacity-40 transition-colors"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={loading}
                  className="text-sm px-4 py-1.5 rounded border border-[var(--color-red)] text-[var(--color-red-text)] hover:bg-[var(--color-red-bg)] disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Désactivation…' : 'Désactiver le DCA'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Montant */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="dca-amount"
                  className="text-xs font-medium text-[var(--color-text-sub)]"
                >
                  Montant par passage (€)
                </label>
                <input
                  id="dca-amount"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="ex : 100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:border-[var(--color-text-sub)]"
                />
              </div>

              {/* Fréquence */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="dca-frequency"
                  className="text-xs font-medium text-[var(--color-text-sub)]"
                >
                  Fréquence
                </label>
                <select
                  id="dca-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  disabled={loading}
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text-sub)]"
                >
                  {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                    <option key={f} value={f}>
                      {FREQUENCY_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date de première exécution */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="dca-date"
                  className="text-xs font-medium text-[var(--color-text-sub)]"
                >
                  Première exécution
                </label>
                <input
                  id="dca-date"
                  type="date"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text-sub)]"
                />
              </div>

              {/* Enveloppe */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="dca-envelope"
                  className="text-xs font-medium text-[var(--color-text-sub)]"
                >
                  Enveloppe
                </label>
                <select
                  id="dca-envelope"
                  value={envelope}
                  onChange={(e) => setEnvelope(e.target.value)}
                  disabled={loading}
                  className="w-full text-sm px-2.5 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text-sub)]"
                >
                  <option value="">— Aucune —</option>
                  {ENVELOPES.map((env) => (
                    <option key={env} value={env}>
                      {env}
                    </option>
                  ))}
                </select>
              </div>

              {errorMsg && (
                <p className="text-xs text-[var(--color-red-text)]">{errorMsg}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-sm px-4 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text-sub)] hover:text-[var(--color-text)] disabled:opacity-40 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-sm px-4 py-1.5 rounded border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-surface)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Activation…' : 'Activer le DCA'}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
