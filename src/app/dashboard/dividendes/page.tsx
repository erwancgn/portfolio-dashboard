'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LogoutButton from '@/components/layout/LogoutButton'
import DividendProjection from '@/components/dividends/DividendProjection'
import DividendCalendar from '@/components/dividends/DividendCalendar'
import type { DividendsApiResponse } from '@/app/api/dividends/route'

type LoadState = 'loading' | 'success' | 'error'

/**
 * DividendesPage — Client Component.
 * Charge les données via /api/dividends et affiche projection + calendrier.
 */
export default function DividendesPage() {
  const [state, setState] = useState<LoadState>('loading')
  const [data, setData] = useState<DividendsApiResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')

  useEffect(() => {
    fetch('/api/dividends')
      .then(async (res) => {
        if (!res.ok) {
          const err = (await res.json()) as { error?: string }
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }
        return res.json() as Promise<DividendsApiResponse>
      })
      .then((json) => {
        setData(json)
        setState('success')
      })
      .catch((err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
        setState('error')
      })
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)]/80 bg-[color:color-mix(in_srgb,var(--color-bg-primary)_86%,white_14%)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors"
            >
              ← Retour
            </Link>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-dim)]">
                Portfolio Control
              </p>
              <span className="font-semibold tracking-tight text-[var(--color-text)]">
                Dividendes
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/dashboard/analyse"
              className="whitespace-nowrap text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              Analyse
            </Link>
            <Link
              href="/dashboard/historique"
              className="whitespace-nowrap text-sm text-[var(--color-text-sub)] transition-colors hover:text-[var(--color-text)]"
            >
              Historique
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Titre de section */}
        <section className="glass-card overflow-hidden rounded-[28px]">
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--color-text-sub)]">
              Revenus passifs
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
              Calendrier des dividendes
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-sub)] sm:text-base">
              Historique reconstitué depuis vos achats/ventes et projections sur 12 mois à partir des positions ouvertes.
              Les montants restent affichés dans la devise native de chaque ligne.
            </p>
          </div>
        </section>

        {/* États de chargement */}
        {state === 'loading' && (
          <div className="glass-card rounded-2xl px-5 py-12 text-center">
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-text-dim)] border-t-[var(--color-text)]" />
            <p className="text-sm text-[var(--color-text-sub)]">
              Chargement des données dividendes…
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="glass-card rounded-2xl border border-red-200 px-5 py-8 text-center">
            <p className="text-sm font-medium text-red-600">Erreur lors du chargement</p>
            <p className="mt-1 text-xs text-[var(--color-text-sub)]">{errorMsg}</p>
          </div>
        )}

        {state === 'success' && data && (
          <>
            {data.warnings.length > 0 && (
              <div className="glass-card rounded-2xl border border-amber-200 px-5 py-4">
                <p className="text-sm font-medium text-amber-800">Chargement partiel</p>
                <div className="mt-1 space-y-1 text-xs text-amber-700">
                  {data.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Résumé projection */}
            <DividendProjection data={data} />

            {/* Calendrier */}
            <DividendCalendar data={data} />
          </>
        )}
      </main>
    </div>
  )
}
