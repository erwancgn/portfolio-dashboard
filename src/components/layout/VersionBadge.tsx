'use client'

import { useState } from 'react'
import { VERSION_CURRENT, VERSION_HISTORY } from '@/lib/version'

/**
 * VersionBadge — badge cliquable dans le header.
 * Ouvre une modale listant les nouveautés par version.
 */
export default function VersionBadge() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-sub)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors tabular-nums"
      >
        v{VERSION_CURRENT}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modale */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">Nouveautés</h2>
                <p className="text-xs text-[var(--color-text-sub)] mt-0.5">Portfolio Dashboard</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Versions */}
            <div className="overflow-y-auto max-h-[60vh] px-5 py-4 space-y-6">
              {VERSION_HISTORY.map((entry, i) => (
                <div key={entry.version}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${
                      i === 0
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-sub)]'
                    }`}>
                      v{entry.version}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-text)]">{entry.label}</span>
                    <span className="text-xs text-[var(--color-text-sub)] ml-auto">{entry.date}</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {entry.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text)]">
                        <span className="text-[var(--color-accent)] mt-0.5 shrink-0">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
