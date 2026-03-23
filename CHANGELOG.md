# CHANGELOG — Portfolio Dashboard IA

> Format : [Semver](https://semver.org) — MAJOR.MINOR.PATCH
> MAJOR : changement incompatible
> MINOR : nouvelle fonctionnalité
> PATCH : correction de bug

---

## [Unreleased]
> Fonctionnalités en cours de développement — pas encore livrées.

### Added
- **API Route `/api/quote`** — prix temps réel actions/ETF (Yahoo Finance, couverture mondiale) et crypto (CoinGecko). Paramètres : `ticker`, `type` (stock|crypto).
- **API Route `/api/exchange-rate`** — taux de change via Frankfurter (gratuit, sans clé). Paramètres : `from`, `to`. Retourne `{ from, to, rate }`.
- **API Route `/api/search`** — recherche par nom ou ticker (Yahoo Finance pour stocks/ETF, CoinGecko pour crypto). Retourne max 8 suggestions `{ ticker, name, type }`.
- Skills Vercel installés : `vercel-react-best-practices`, `next-best-practices`, `next-cache-components`
- **Enum `asset_type`** en base de données — colonne `type` ajoutée à la table `positions` avec les valeurs `stock | etf | crypto`
- **API Route `POST /api/positions`** — insert d'une position avec validation des champs obligatoires, incluant `isin` (US-001)
- **API Route `GET /api/positions`** — liste des positions de l'utilisateur connecté, triées par date (US-001)
- **Composant `AddPositionForm`** — formulaire 8 champs (ticker, nom, ISIN, type, quantité, PRU, enveloppe, devise), suggestions de recherche, auto-remplissage par ISIN (US-001)
- **Composant `SearchInput`** — champ texte avec dropdown de suggestions debounce 400ms, badges colorés par type (stock/etf/crypto), active sur Ticker et Nom
- **Composant `PositionsTable`** — Server Component, 10 colonnes (ticker, nom, type, qté, PRU, prix actuel, valeur, P&L€, P&L%, poids%), tri par valeur décroissante (US-002)
- **Lookup ISIN** — saisie de 12 caractères dans le champ ISIN déclenche automatiquement la recherche et remplit ticker + nom + type

### Fixed
- Remplacement de tous les `style={{}}` inline par des classes Tailwind v4 (FIX-001)
- Script `npm run lint` corrigé pour Next.js 16 — `npx eslint src --ext .ts,.tsx` (FIX-#44)
- Migration Finnhub → Yahoo Finance : couverture mondiale US + EU + crypto, sans clé API
- `PositionsTable` : fetch HTTP interne remplacé par requête Supabase directe (cookies d'auth non transmis via fetch)
- Conversion devise : prix USD/GBp/GBP convertis en EUR via Frankfurter avant affichage
- Dropdown suggestions : ne rouvre plus après sélection d'une suggestion
- ISIN : auto-rempli depuis la sélection d'une suggestion si Yahoo Finance le retourne

---

## Versions livrées

Aucune version livrée pour le moment.

---

## Comprendre le versioning

| Version | Signification | Exemple |
|---|---|---|
| 1.0.0 | MVP livré et validé | Premier dashboard fonctionnel |
| 1.1.0 | Nouvelle fonctionnalité | Ajout de l'agent surveillance |
| 1.1.1 | Bug corrigé | Fix calcul PRU incorrect |
| 2.0.0 | Refonte majeure | Migration vers nouvelle stack |
