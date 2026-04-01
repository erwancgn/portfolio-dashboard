'use client'

import { useState } from 'react'
import QuickAnalysis from './QuickAnalysis'
import FairValue from './FairValue'

type Tab = 'quick' | 'fairvalue'

const TABS: { id: Tab; label: string }[] = [
  { id: 'quick', label: 'Analyse rapide' },
  { id: 'fairvalue', label: 'Fair value' },
]

/**
 * AssetAnalysisTabs — Client Component.
 * Wrapper à onglets pour les deux modes d'analyse d'un actif :
 * - Analyse rapide (signal BUY/HOLD/SELL via Gemini)
 * - Fair value (estimation prix cible via Gemini + Search Grounding)
 *
 * QuickAnalysis rend son propre wrapper <section> — on ne l'encapsule pas
 * pour éviter un double-card. FairValue est affiché dans un wrapper dédié.
 */
export default function AssetAnalysisTabs() {
  const [active, setActive] = useState<Tab>('quick')

  return (
    <div className="space-y-0">
      {/* Barre d'onglets */}
      <div className="flex gap-1 border-b border-[var(--color-border)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              active === tab.id
                ? 'text-[var(--color-text)] border-[var(--color-accent)]'
                : 'text-[var(--color-text-sub)] border-transparent hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu : QuickAnalysis a son propre wrapper section */}
      {active === 'quick' ? (
        <QuickAnalysis />
      ) : (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Fair value</h2>
            <p className="text-xs text-[var(--color-text-sub)] mt-0.5">
              Estimation du prix cible par analyse fondamentale IA
            </p>
          </div>
          <div className="px-4 py-4">
            <FairValue />
          </div>
        </section>
      )}
    </div>
  )
}
