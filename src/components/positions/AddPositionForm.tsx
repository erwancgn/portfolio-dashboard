'use client'

import { useState, useCallback, useEffect, type FormEvent } from 'react'
import SearchInput from './SearchInput'
import type { SearchResult } from '@/app/api/search/route'
import type { QuoteResponse } from '@/app/api/quote/route'

interface AddPositionFormProps {
  onPositionAdded: () => void
}

interface FormState {
  ticker: string
  name: string
  isin: string
  type: 'stock' | 'etf' | 'crypto'
  quantity: string
  pru: string
  envelope: string
  currency: string
}

const INITIAL_STATE: FormState = {
  ticker: '',
  name: '',
  isin: '',
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
  const [isinStatus, setIsinStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')

  // Recherche par ISIN dès que 12 caractères sont saisis
  useEffect(() => {
    if (form.isin.trim().length !== 12) return
    const timer = setTimeout(async () => {
      setIsinStatus('loading')
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(form.isin.trim())}&type=stock`)
        if (res.ok) {
          const data = (await res.json()) as import('@/app/api/search/route').SearchResult[]
          if (data.length > 0) {
            setForm((prev) => ({ ...prev, ticker: data[0].ticker, name: data[0].name, type: data[0].type }))
            setIsinStatus('found')
          } else {
            setIsinStatus('not_found')
          }
        } else {
          setIsinStatus('not_found')
        }
      } catch {
        setIsinStatus('not_found')
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [form.isin])

  const handleTickerChange = useCallback((ticker: string) => {
    setForm((prev) => ({ ...prev, ticker }))
  }, [])

  const handleNameChange = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, name }))
  }, [])

  const handleSuggestionSelected = useCallback((result: SearchResult) => {
    setForm((prev) => ({ ...prev, ticker: result.ticker, name: result.name, type: result.type }))
    // Tentative de récupération de l'ISIN via /api/quote (disponible sur certains actifs EU)
    void fetch(`/api/quote?ticker=${encodeURIComponent(result.ticker)}`)
      .then((res) => res.ok ? res.json() as Promise<QuoteResponse> : null)
      .then((data) => {
        if (data?.isin) {
          setForm((prev) => ({ ...prev, isin: data.isin! }))
          setIsinStatus('found')
        }
      })
      .catch(() => null)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'isin') setIsinStatus('idle')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const payload = {
      ticker: form.ticker.trim(),
      name: form.name.trim() || undefined,
      isin: form.isin.trim() || undefined,
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
        <SearchInput
          id="ticker"
          label="Ticker"
          placeholder="ex : AAPL"
          value={form.ticker}
          assetType={form.type}
          required
          onChange={handleTickerChange}
          onSuggestionSelected={handleSuggestionSelected}
        />

        <SearchInput
          id="name"
          label="Nom"
          placeholder="ex : Apple Inc."
          value={form.name}
          assetType={form.type}
          onChange={handleNameChange}
          onSuggestionSelected={handleSuggestionSelected}
        />

        <div>
          <label htmlFor="isin" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            ISIN
          </label>
          <input id="isin" name="isin" type="text" value={form.isin} onChange={handleChange}
            placeholder="ex : US0378331005" className={INPUT_CLASS} maxLength={12} />
          {isinStatus === 'loading' && <p className="mt-1 text-xs text-[var(--color-text-sub)]">Recherche…</p>}
          {isinStatus === 'found' && <p className="mt-1 text-xs text-green-500">✓ Ticker et nom détectés</p>}
          {isinStatus === 'not_found' && <p className="mt-1 text-xs text-red-500">ISIN introuvable — saisir le ticker manuellement</p>}
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
