'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const QuickAnalysis = dynamic(() => import('./QuickAnalysis'))
const FairValue = dynamic(() => import('./FairValue'))
const ClassicAnalysis = dynamic(() => import('./ClassicAnalysis'))

type Tab = 'quick' | 'fairvalue' | 'classic'

const TABS: { id: Tab; label: string }[] = [
  { id: 'quick', label: 'Analyse rapide' },
  { id: 'fairvalue', label: 'Fair value' },
  { id: 'classic', label: 'Buffett / Lynch' },
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
      <div className="mb-4 flex gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu : QuickAnalysis et ClassicAnalysis ont leur propre wrapper section */}
      {active === 'quick' ? (
        <QuickAnalysis />
      ) : active === 'classic' ? (
        <ClassicAnalysis />
      ) : (
        <section className="glass-card rounded-[28px] overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
              Valorisation
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">Fair value</h2>
            <p className="mt-1 text-sm text-[var(--color-text-sub)]">
              Estimation du prix cible par analyse fondamentale IA
            </p>
          </div>
          <div className="px-5 py-5">
            <FairValue />
          </div>
        </section>
      )}
    </div>
  )
}
