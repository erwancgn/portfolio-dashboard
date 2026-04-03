'use client'

import { useState, useEffect } from 'react'
import type { QuoteResponse } from '@/app/api/quote/route'

interface TickerInputProps {
  value: string
  assetType: 'stock' | 'etf' | 'crypto'
  onChange: (ticker: string) => void
  onValidated: (name: string) => void
}

type CheckStatus = 'idle' | 'checking' | 'valid' | 'invalid'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

/**
 * Champ ticker avec validation debounce 500ms.
 * Appelle /api/quote pour vérifier le ticker et récupérer le nom de l'actif.
 * Notifie le parent via onValidated(name) quand le ticker est reconnu.
 */
export default function TickerInput({ value, assetType, onChange, onValidated }: TickerInputProps) {
  const [status, setStatus] = useState<CheckStatus>('idle')
  const [label, setLabel] = useState<string>('')

  useEffect(() => {
    if (value.length < 1) return
    const quoteType = assetType === 'crypto' ? 'crypto' : 'stock'
    const timer = setTimeout(async () => {
      setStatus('checking')
      try {
        const res = await fetch(
          `/api/quote?ticker=${encodeURIComponent(value)}&type=${quoteType}&enrich=0`,
        )
        if (res.ok) {
          const data = (await res.json()) as QuoteResponse
          setStatus('valid')
          setLabel(data.name)
          onValidated(data.name)
        } else {
          setStatus('invalid')
          setLabel('')
        }
      } catch {
        setStatus('invalid')
        setLabel('')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [value, assetType, onValidated])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const upper = e.target.value.toUpperCase()
    if (upper === '') {
      setStatus('idle')
      setLabel('')
    }
    onChange(upper)
  }

  return (
    <div>
      <label htmlFor="ticker" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
        Ticker <span className="text-red-500">*</span>
      </label>
      <input
        id="ticker"
        name="ticker"
        type="text"
        required
        value={value}
        onChange={handleChange}
        placeholder="ex : AAPL"
        className={INPUT_CLASS}
      />
      {status === 'checking' && (
        <p className="mt-1 text-xs text-[var(--color-text-sub)]">Vérification…</p>
      )}
      {status === 'valid' && (
        <p className="mt-1 text-xs text-green-500">✓ {label}</p>
      )}
      {status === 'invalid' && (
        <p className="mt-1 text-xs text-red-500">Ticker introuvable</p>
      )}
    </div>
  )
}
