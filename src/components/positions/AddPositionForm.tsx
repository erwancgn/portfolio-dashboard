'use client'

import SearchInput from './SearchInput'
import { useAddPositionForm } from './useAddPositionForm'

interface AddPositionFormProps {
  onPositionAdded: () => void
}

const SELECT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

const INPUT_CLASS =
  'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-sub)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]'

/**
 * Formulaire d'ajout d'une position — Client Component.
 * Toute la logique metier est dans useAddPositionForm.
 */
export default function AddPositionForm({ onPositionAdded }: AddPositionFormProps) {
  const {
    form,
    status,
    message,
    isinStatus,
    handleTickerChange,
    handleNameChange,
    handleTickerBlur,
    handleSuggestionSelected,
    handleChange,
    handleSubmit,
  } = useAddPositionForm(onPositionAdded)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Ajouter une position</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchInput
          id="ticker"
          label="Ticker"
          placeholder="ex : AAPL"
          value={form.ticker}
          assetType={form.type}
          required
          onChange={handleTickerChange}
          onSuggestionSelected={handleSuggestionSelected}
          onBlur={handleTickerBlur}
        />

        <SearchInput
          id="name"
          label="Nom"
          placeholder="ex : Apple Inc."
          value={form.name}
          assetType={form.type}
          onChange={handleNameChange}
          onSuggestionSelected={handleSuggestionSelected}
        />

        <div>
          <label htmlFor="isin" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            ISIN
          </label>
          <input id="isin" name="isin" type="text" value={form.isin} onChange={handleChange}
            placeholder="ex : US0378331005" className={INPUT_CLASS} maxLength={12} />
          {isinStatus === 'loading' && <p className="mt-1 text-xs text-[var(--color-text-sub)]">Recherche…</p>}
          {isinStatus === 'found' && <p className="mt-1 text-xs text-green-500">Ticker et nom détectés</p>}
          {isinStatus === 'not_found' && <p className="mt-1 text-xs text-red-500">ISIN introuvable — saisir le ticker manuellement</p>}
        </div>

        <div>
          <label htmlFor="sector" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Secteur
          </label>
          <input id="sector" name="sector" type="text" value={form.sector} onChange={handleChange}
            placeholder="ex : Technology" className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <select id="type" name="type" required value={form.type} onChange={handleChange} className={SELECT_CLASS}>
            <option value="stock">Action (stock)</option>
            <option value="etf">ETF</option>
            <option value="crypto">Crypto</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Quantité <span className="text-red-500">*</span>
          </label>
          <input id="quantity" name="quantity" type="number" required min="0.000001" step="any"
            value={form.quantity} onChange={handleChange} placeholder="ex : 10" className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="pru" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            PRU (€) <span className="text-red-500">*</span>
          </label>
          <input id="pru" name="pru" type="number" required min="0.000001" step="any"
            value={form.pru} onChange={handleChange} placeholder="ex : 150.50" className={INPUT_CLASS} />
        </div>

        <div>
          <label htmlFor="envelope" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Enveloppe
          </label>
          <select id="envelope" name="envelope" value={form.envelope} onChange={handleChange} className={SELECT_CLASS}>
            <option value="">-- Aucune --</option>
            <option value="PEA">PEA</option>
            <option value="CTO">CTO</option>
            <option value="Crypto">Crypto</option>
          </select>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-[var(--color-text-sub)] mb-1">
            Devise
          </label>
          <select id="currency" name="currency" value={form.currency} onChange={handleChange} className={SELECT_CLASS}>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      {status === 'success' && <p className="text-sm font-medium text-green-500">{message}</p>}
      {status === 'error' && <p className="text-sm font-medium text-red-500">{message}</p>}

      <button type="submit" disabled={status === 'loading'}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
        {status === 'loading' ? 'Ajout en cours…' : 'Ajouter la position'}
      </button>
    </form>
  )
}
