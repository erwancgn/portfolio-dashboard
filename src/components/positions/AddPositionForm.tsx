'use client'

import { useState, useCallback, type FormEvent } from 'react'
import TickerInput from './TickerInput'

interface AddPositionFormProps {
  onPositionAdded: () => void
}

interface FormState {
  ticker: string
  name: string
  type: 'stock' | 'etf' | 'crypto'
  quantity: string
  pru: string
  envelope: string
  currency: string
}

const INITIAL_STATE: FormState = {
  ticker: '',
  name: '',
  type: 'stock',
  quantity: '',
  pru: '',
  envelope: '',
  currency: 'EUR',
}

const SELECT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

/**
 * Formulaire d'ajout d'une position — Client Component.
 * Envoie un POST vers /api/positions et notifie le parent via onPositionAdded.
 */
export default function AddPositionForm({ onPositionAdded }: AddPositionFormProps) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const handleTickerChange = useCallback((ticker: string) => {
    setForm((prev) => ({ ...prev, ticker }))
  }, [])

  const handleTickerValidated = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, name }))
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const payload = {
      ticker: form.ticker.trim(),
      name: form.name.trim() || undefined,
      type: form.type,
      quantity: parseFloat(form.quantity),
      pru: parseFloat(form.pru),
      envelope: form.envelope || undefined,
      currency: form.currency,
    }

    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error ?? 'Erreur lors de l\'ajout de la position')
        return
      }
      setStatus('success')
      setMessage('Position ajoutée avec succès.')
      setForm(INITIAL_STATE)
      onPositionAdded()
    } catch {
      setStatus('error')
      setMessage('Erreur réseau — veuillez réessayer.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Ajouter une position</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TickerInput
          value={form.ticker}
          assetType={form.type}
          onChange={handleTickerChange}
          onValidated={handleTickerValidated}
        />

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Nom
          </label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange}
            placeholder="ex : Apple Inc." className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select id="type" name="type" required value={form.type} onChange={handleChange} className={SELECT_CLASS}>
            <option value="stock">Action (stock)</option>
            <option value="etf">ETF</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input id="quantity" name="quantity" type="number" required min="0.000001" step="any"
            value={form.quantity} onChange={handleChange} placeholder="ex : 10" className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="pru" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            PRU (€) <span className="text-red-500">*</span>
          </label>
          <input id="pru" name="pru" type="number" required min="0.000001" step="any"
            value={form.pru} onChange={handleChange} placeholder="ex : 150.50" className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="envelope" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Enveloppe
          </label>
          <select id="envelope" name="envelope" value={form.envelope} onChange={handleChange} className={SELECT_CLASS}>
            <option value="">-- Aucune --</option>
            <option value="PEA">PEA</option>
            <option value="CTO">CTO</option>
            <option value="Crypto">Crypto</option>
            <option value="PEA-PME">PEA-PME</option>
          </select>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Devise
          </label>
          <select id="currency" name="currency" value={form.currency} onChange={handleChange} className={SELECT_CLASS}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {status === 'success' && <p className="text-sm font-medium text-green-500">{message}</p>}
      {status === 'error' && <p className="text-sm font-medium text-red-500">{message}</p>}

      <button type="submit" disabled={status === 'loading'}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
        {status === 'loading' ? 'Ajout en cours…' : 'Ajouter la position'}
      </button>
    </form>
  )
}
