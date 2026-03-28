'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatEur } from '@/lib/format'

interface Transaction {
  id: string
  ticker: string
  type: string
  quantity: number
  price: number
  total: number
  tax_amount: number
  executed_at: string
}

interface TransactionsTableProps {
  transactions: Transaction[]
}

/**
 * TransactionsTable — Client Component.
 * Affiche l'historique des transactions avec filtres par date côté client.
 * Utilise le composant Table de shadcn/ui.
 */
export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const date = t.executed_at.slice(0, 10)
      if (dateFrom && date < dateFrom) return false
      if (dateTo && date > dateTo) return false
      return true
    })
  }, [transactions, dateFrom, dateTo])

  return (
    <div className="rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] p-6">
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="date-from" className="text-xs text-[var(--color-text-sub)]">
            Du
          </label>
          <input
            id="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-sm px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="date-to" className="text-xs text-[var(--color-text-sub)]">
            Au
          </label>
          <input
            id="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-sm px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-blue-500"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-xs text-[var(--color-text-sub)] hover:text-[var(--color-text)] transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-text-sub)]">Aucune transaction sur cette période.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Taxe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-[var(--color-text-sub)]">
                  {new Date(t.executed_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="font-mono font-semibold text-[var(--color-text)]">
                  {t.ticker}
                </TableCell>
                <TableCell>
                  {t.type === 'buy' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                      Achat
                    </span>
                  )}
                  {t.type === 'sell' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                      Vente
                    </span>
                  )}
                  {t.type === 'deposit' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                      Apport
                    </span>
                  )}
                  {t.type === 'withdraw' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-text-sub)]/10 text-[var(--color-text-sub)]">
                      Retrait
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right text-[var(--color-text)]">{t.quantity}</TableCell>
                <TableCell className="text-right text-[var(--color-text)]">{formatEur(t.price)}</TableCell>
                <TableCell className="text-right text-[var(--color-text)]">{formatEur(t.total)}</TableCell>
                <TableCell className="text-right text-[var(--color-text-sub)]">
                  {t.tax_amount > 0 ? formatEur(t.tax_amount) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
