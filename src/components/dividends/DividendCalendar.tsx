'use client'

import { useState } from 'react'
import type { DividendsApiResponse } from '@/app/api/dividends/route'
import {
  buildCalendarEvents,
  formatCalendarAmount,
  formatMonthLabel,
  formatMonthTotal,
} from './calendar-utils'

interface Props {
  data: DividendsApiResponse
}

type ViewMode = 'upcoming' | 'history'

/**
 * DividendCalendar — affiche les dividendes en vue liste mois par mois.
 * Deux onglets : "Prochains" (projetés) et "Historique" (passés réels).
 */
export default function DividendCalendar({ data }: Props) {
  const [view, setView] = useState<ViewMode>('upcoming')

  if (data.positions.length === 0) {
    return (
      <div className="glass-card rounded-2xl px-5 py-10 text-center">
        <p className="text-[var(--color-text-sub)]">
          Aucune position avec des dividendes détectés.
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-dim)]">
          La source est ignorée si aucun historique de distribution n’est retourné.
        </p>
      </div>
    )
  }

  const grouped = buildCalendarEvents(data)
  const today = new Date().toISOString().slice(0, 10)

  const upcomingMonths = [...grouped.entries()]
    .filter(([, events]) => events.some((e) => !e.isPast))
    .map(([month, events]) => ({ month, events: events.filter((e) => !e.isPast) }))

  const historyMonths = [...grouped.entries()]
    .filter(([, events]) => events.some((e) => e.isPast))
    .map(([month, events]) => ({ month, events: events.filter((e) => e.isPast) }))
    .reverse()

  const displayed = view === 'upcoming' ? upcomingMonths : historyMonths

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header + onglets */}
      <div className="px-5 py-4 border-b border-[var(--color-border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-dim)]">
            Calendrier
          </p>
          <h3 className="mt-1 text-base font-semibold tracking-tight text-[var(--color-text)]">
            Dividendes par mois
          </h3>
        </div>
        <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden self-start sm:self-auto">
          <button
            onClick={() => setView('upcoming')}
            className={[
              'px-4 py-1.5 text-xs font-medium transition-colors',
              view === 'upcoming'
                ? 'bg-[var(--color-text)] text-[var(--color-bg-primary)]'
                : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            Prochains
          </button>
          <button
            onClick={() => setView('history')}
            className={[
              'px-4 py-1.5 text-xs font-medium transition-colors border-l border-[var(--color-border)]',
              view === 'history'
                ? 'bg-[var(--color-text)] text-[var(--color-bg-primary)]'
                : 'text-[var(--color-text-sub)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            Historique
          </button>
        </div>
      </div>

      {/* Liste par mois */}
      <div className="divide-y divide-[var(--color-border)]">
        {displayed.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-[var(--color-text-sub)]">
            {view === 'upcoming'
              ? 'Aucun dividende projeté sur les 12 prochains mois.'
              : 'Aucun historique sur les 12 derniers mois.'}
          </div>
        )}

        {displayed.map(({ month, events }) => {
          return (
            <div key={month}>
              <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-bg-secondary)]">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-sub)] capitalize">
                  {formatMonthLabel(month)}
                </span>
                <span className="text-xs font-semibold text-[var(--color-text)]">
                  {formatMonthTotal(events)}
                </span>
              </div>

              {events.map((event, idx) => (
                <div
                  key={`${event.ticker}-${event.date}-${idx}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center w-10 shrink-0">
                      <span
                        className={[
                          'text-sm font-semibold tabular-nums',
                          event.date === today
                            ? 'text-[var(--color-text)]'
                            : event.isPast
                              ? 'text-[var(--color-text-dim)]'
                              : 'text-[var(--color-text-sub)]',
                        ].join(' ')}
                      >
                        {event.date.slice(8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {event.ticker}
                      </span>
                      <p className="text-xs text-[var(--color-text-dim)]">
                        {formatCalendarAmount(event.amountPerShare, event.currency)} / action
                        {event.isPast ? '' : ' · estimé'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={[
                        'text-sm font-semibold tabular-nums',
                        event.isPast ? 'text-[var(--color-text-sub)]' : 'text-[var(--color-text)]',
                      ].join(' ')}
                    >
                      {formatCalendarAmount(event.totalAmount, event.currency)}
                    </span>
                    {!event.isPast && (
                      <p className="text-[10px] text-[var(--color-text-dim)]">projeté</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
