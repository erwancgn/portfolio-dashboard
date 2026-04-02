'use client'

import { useEffect, useRef, useState } from 'react'
import type { SearchResult } from '@/app/api/search/route'

export function useAssetSearch(query: string) {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const normalized = query.trim()
    if (normalized.length < 2) {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(normalized)}`)
        if (!res.ok) return

        setSuggestions((await res.json()) as SearchResult[])
        setShowSuggestions(true)
      } catch {
        // Recherche silencieuse
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function selectSuggestion(suggestion: SearchResult) {
    setSuggestions([])
    setShowSuggestions(false)
    return suggestion.ticker
  }

  const normalized = query.trim()

  return {
    suggestions: normalized.length >= 2 ? suggestions : [],
    showSuggestions: normalized.length >= 2 && showSuggestions,
    wrapperRef,
    setShowSuggestions,
    selectSuggestion,
  }
}
