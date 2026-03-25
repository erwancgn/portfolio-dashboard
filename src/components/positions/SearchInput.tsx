'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SearchResult } from '@/app/api/search/route'

interface SearchInputProps {
  id: string
  label: string
  placeholder: string
  value: string
  assetType: 'stock' | 'etf' | 'crypto'
  required?: boolean
  onChange: (value: string) => void
  onSuggestionSelected: (result: SearchResult) => void
  /** Callback optionnel appele apres la fermeture du dropdown (blur) */
  onBlur?: () => void
}

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

const BADGE_CLASSES: Record<SearchResult['type'], string> = {
  stock: 'bg-blue-100 text-blue-700',
  etf: 'bg-purple-100 text-purple-700',
  crypto: 'bg-orange-100 text-orange-700',
}

/**
 * Champ texte avec dropdown de suggestions de recherche (debounce 400ms).
 * Appelle /api/search?q={value}&type={stock|crypto} pour récupérer les suggestions.
 * Notifie le parent via onSuggestionSelected quand l'utilisateur sélectionne une suggestion.
 */
export default function SearchInput({
  id,
  label,
  placeholder,
  value,
  assetType,
  required,
  onChange,
  onSuggestionSelected,
  onBlur: onBlurProp,
}: SearchInputProps) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const prevAssetType = useRef(assetType)
  const justSelectedRef = useRef(false)

  // Reset suggestions quand assetType change
  useEffect(() => {
    if (prevAssetType.current !== assetType) {
      prevAssetType.current = assetType
      setSuggestions([])
      setIsOpen(false)
    }
  }, [assetType])

  // Recherche avec debounce 400ms
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }
    // Bloquer la re-recherche juste après une sélection
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(value)}`,
        )
        if (res.ok) {
          const data = (await res.json()) as SearchResult[]
          setSuggestions(data)
          setIsOpen(data.length > 0)
        } else {
          setSuggestions([])
          setIsOpen(false)
        }
      } catch {
        setSuggestions([])
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [value, assetType])

  const handleSelect = useCallback(
    (result: SearchResult) => {
      justSelectedRef.current = true
      onSuggestionSelected(result)
      setIsOpen(false)
      setSuggestions([])
    },
    [onSuggestionSelected],
  )

  function handleBlur() {
    setTimeout(() => {
      setIsOpen(false)
      onBlurProp?.()
    }, 150)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value)
  }

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-text-sub)] mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required={required}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={INPUT_CLASS}
        autoComplete="off"
      />
      {isLoading && (
        <p className="mt-1 text-xs text-[var(--color-text-sub)]">Recherche…</p>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-lg">
          {suggestions.map((result) => (
            <li
              key={`${result.ticker}-${result.type}`}
              onMouseDown={() => handleSelect(result)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-bg-secondary)] flex justify-between items-center"
            >
              <span className="text-[var(--color-text)]">
                <span className="font-medium">{result.ticker}</span>
                {' — '}
                <span className="text-[var(--color-text-sub)]">{result.name}</span>
              </span>
              <span
                className={`ml-2 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[result.type]}`}
              >
                {result.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
