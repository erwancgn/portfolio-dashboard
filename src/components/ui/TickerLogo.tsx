'use client'

import { useState } from 'react'

interface TickerLogoProps {
  logoUrl?: string | null
  ticker: string
  size: 'sm' | 'md'
}

/** Tailles selon le variant */
const SIZE_CLASSES: Record<TickerLogoProps['size'], string> = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-12 h-12 rounded-xl',
}

/**
 * TickerLogo — affiche le logo d'un actif.
 * Fallback vers les 2 premieres lettres du ticker si logo absent ou erreur de chargement.
 */
export default function TickerLogo({ logoUrl, ticker, size }: TickerLogoProps) {
  const [imgError, setImgError] = useState(false)

  const sizeClass = SIZE_CLASSES[size]
  const initials = ticker.slice(0, 2).toUpperCase()

  if (!logoUrl || imgError) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center bg-[var(--color-bg-elevated)] shrink-0`}
      >
        <span className="text-xs font-bold text-[var(--color-text-sub)]">{initials}</span>
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- domaines FMP dynamiques, incompatibles next/image sans whitelist statique
    <img
      src={logoUrl}
      alt={ticker}
      className={`${sizeClass} object-contain bg-white shrink-0`}
      onError={() => setImgError(true)}
    />
  )
}
