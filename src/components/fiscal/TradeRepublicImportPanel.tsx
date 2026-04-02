'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface TradeRepublicImportPanelProps {
  hasImports: boolean
}

export default function TradeRepublicImportPanel({
  hasImports,
}: TradeRepublicImportPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/imports/trade-republic', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json() as {
        error?: string
        eventCount?: number
        warnings?: string[]
        sourceYear?: number | null
      }

      if (!response.ok) {
        setError(payload.error ?? "L'import a échoué")
        return
      }

      setStatus(
        payload.warnings && payload.warnings.length > 0
          ? `Import terminé avec avertissements. ${payload.eventCount ?? 0} mouvements détectés.`
          : `Import terminé. ${payload.eventCount ?? 0} mouvements détectés${payload.sourceYear ? ` pour ${payload.sourceYear}` : ''}.`,
      )
      router.refresh()
    } catch {
      setError("Erreur réseau pendant l'import")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="glass-card rounded-[28px] px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Import broker
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
            Import PDF Trade Republic
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-sub)]">
            Dépose un relevé PDF Trade Republic ou l’IFU annuel pour extraire automatiquement mouvements, taxes, frais et cases fiscales déclaratives.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]">
          {loading ? 'Import en cours…' : 'Choisir un PDF'}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="sr-only"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-sub)]">
          {hasImports
            ? "Les documents déjà importés alimentent le récapitulatif fiscal ci-dessous."
            : "Aucun relevé importé pour l'instant. Le premier import servira de base pour enrichir la fiscalité déclarative."}
        </div>
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-sm text-[var(--color-text-sub)]">
          Le parser gère désormais l’IFU Trade Republic 2025 comme document de référence, et garde un mode heuristique pour les relevés mensuels.
        </div>
      </div>

      {status && (
        <p className="mt-4 rounded-[18px] border border-[var(--color-green)]/25 bg-[var(--color-green-bg)] px-4 py-3 text-sm text-[var(--color-green-text)]">
          {status}
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
