'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DemoBootstrapPanelProps {
  hasData: boolean
}

export default function DemoBootstrapPanel({ hasData }: DemoBootstrapPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBootstrap() {
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/dev/bootstrap-demo', {
        method: 'POST',
      })

      const payload = await response.json() as {
        error?: string
        seeded?: boolean
        reason?: string
      }

      if (!response.ok) {
        setError(payload.error ?? 'Impossible de charger les données de démonstration')
        return
      }

      if (payload.reason === 'existing_data') {
        setMessage('Des données existent déjà sur ce compte. Aucun bootstrap supplémentaire appliqué.')
        return
      }

      setMessage('Données de démonstration chargées. La page va se rafraîchir.')
      router.refresh()
    } catch {
      setError('Erreur réseau pendant le bootstrap local')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass-card rounded-[28px] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Local demo
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
            Jeu de données local
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-sub)]">
            Crée des transactions 2025 et un IFU Trade Republic de démonstration pour l’utilisateur connecté. Disponible uniquement en local.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBootstrap}
          disabled={loading}
          className="cursor-pointer rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Chargement…' : hasData ? 'Vérifier le bootstrap' : 'Charger les données démo'}
        </button>
      </div>

      {message && (
        <p className="mt-4 rounded-[18px] border border-[var(--color-green)]/25 bg-[var(--color-green-bg)] px-4 py-3 text-sm text-[var(--color-green-text)]">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-[18px] border border-[var(--color-red)]/20 bg-[var(--color-red-bg)] px-4 py-3 text-sm text-[var(--color-red-text)]">
          {error}
        </p>
      )}
    </section>
  )
}
