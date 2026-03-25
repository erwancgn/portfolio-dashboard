'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { SearchResult } from '@/app/api/search/route'
import type { QuoteResponse } from '@/app/api/quote/route'

export interface FormState {
  ticker: string
  name: string
  isin: string
  sector: string
  type: 'stock' | 'etf' | 'crypto'
  quantity: string
  pru: string
  envelope: string
  currency: string
}

export const INITIAL_STATE: FormState = {
  ticker: '',
  name: '',
  isin: '',
  sector: '',
  type: 'stock',
  quantity: '',
  pru: '',
  envelope: '',
  currency: 'EUR',
}

/**
 * Hook encapsulant toute la logique du formulaire AddPositionForm.
 * Gere l'etat, les lookups ISIN/secteur, et la soumission POST.
 */
export function useAddPositionForm(onPositionAdded: () => void) {
  const [form, setForm] = useState<FormState>(INITIAL_STATE)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [isinStatus, setIsinStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle')
  // Ref pour acceder a la valeur courante du ticker dans les callbacks sans cloture obsolete
  const tickerRef = useRef('')

  // Recherche par ISIN des que 12 caracteres sont saisis
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
    tickerRef.current = ticker
    setForm((prev) => ({ ...prev, ticker }))
  }, [])

  const handleNameChange = useCallback((name: string) => {
    setForm((prev) => ({ ...prev, name }))
  }, [])

  /**
   * Appele quand l'utilisateur quitte le champ ticker sans passer par une suggestion.
   * Lookup direct sans useEffect pour eviter setState synchrone dans un effet (lecon S6).
   */
  const handleTickerBlur = useCallback(() => {
    const ticker = tickerRef.current.trim()
    if (!ticker) return
    void fetch(`/api/quote?ticker=${encodeURIComponent(ticker)}`)
      .then((res) => (res.ok ? (res.json() as Promise<QuoteResponse>) : null))
      .then((data) => {
        if (!data) return
        setForm((prev) => ({
          ...prev,
          ...(data.isin && !prev.isin ? { isin: data.isin } : {}),
          ...(data.sector && !prev.sector ? { sector: data.sector } : {}),
        }))
        if (data.isin) setIsinStatus('found')
      })
      .catch(() => null)
  }, [])

  /** Appele quand une suggestion de la liste deroulante est selectionnee */
  const handleSuggestionSelected = useCallback((result: SearchResult) => {
    setForm((prev) => ({ ...prev, ticker: result.ticker, name: result.name, type: result.type }))
    void fetch(`/api/quote?ticker=${encodeURIComponent(result.ticker)}`)
      .then((res) => (res.ok ? (res.json() as Promise<QuoteResponse>) : null))
      .then((data) => {
        if (!data) return
        setForm((prev) => ({
          ...prev,
          ...(data.isin ? { isin: data.isin } : {}),
          ...(data.sector ? { sector: data.sector } : {}),
        }))
        if (data.isin) setIsinStatus('found')
      })
      .catch(() => null)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'isin') setIsinStatus('idle')
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setMessage('')

    const payload = {
      ticker: form.ticker.trim(),
      name: form.name.trim() || undefined,
      isin: form.isin.trim() || undefined,
      sector: form.sector.trim() || undefined,
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
        setMessage(json.error ?? "Erreur lors de l'ajout de la position")
        return
      }
      setStatus('success')
      setMessage('Position ajoutée avec succès.')
      setForm(INITIAL_STATE)
      setIsinStatus('idle')
      onPositionAdded()
    } catch {
      setStatus('error')
      setMessage('Erreur réseau — veuillez réessayer.')
    }
  }

  return {
    form,
    status,
    message,
    isinStatus,
    handleTickerChange,
    handleNameChange,
    handleTickerBlur,
    handleSuggestionSelected,
    handleChange,
    handleSubmit,
  }
}
