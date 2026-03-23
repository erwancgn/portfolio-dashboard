# CHANGELOG — Portfolio Dashboard IA

> Format : [Semver](https://semver.org) — MAJOR.MINOR.PATCH
> MAJOR : changement incompatible
> MINOR : nouvelle fonctionnalité
> PATCH : correction de bug

---

## [Unreleased]
> Fonctionnalités en cours de développement — pas encore livrées.

### Added
- **API Route `/api/quote`** — prix temps réel actions (Finnhub) et crypto (CoinGecko). Paramètres : `ticker`, `type` (stock|crypto). Retourne `{ ticker, price, currency, source }`.
- **API Route `/api/exchange-rate`** — taux de change via Frankfurter (gratuit, sans clé). Paramètres : `from`, `to`. Retourne `{ from, to, rate }`.
- Skills Vercel installés : `vercel-react-best-practices`, `next-best-practices`, `next-cache-components`
- **Enum `asset_type`** en base de données — colonne `type` ajoutée à la table `positions` avec les valeurs `stock | etf | crypto`
- **API Route `POST /api/positions`** — insert d'une position avec validation des champs obligatoires (US-001)
- **API Route `GET /api/positions`** — liste des positions de l'utilisateur connecté, triées par date (US-001)
- **Composant `AddPositionForm`** — formulaire 7 champs (ticker, nom auto-rempli, type, quantité, PRU, enveloppe, devise), feedback succès/erreur (US-001)
- **Composant `TickerInput`** — auto-complétion debounce 500ms : valide le ticker via `/api/quote` et pré-remplit le nom de l'actif (US-001)
- **`/api/quote` enrichi** — retourne désormais `name` : appel parallèle Finnhub `/stock/profile2` pour les actions, capitalisation du coinId pour les cryptos
- **Composant `PositionsTable`** — Server Component, 10 colonnes (ticker, nom, type, qté, PRU, prix actuel, valeur, P&L€, P&L%, poids%), tri par valeur décroissante (US-002)

### Fixed
- Remplacement de tous les `style={{}}` inline par des classes Tailwind v4 (FIX-001)
- Script `npm run lint` corrigé pour Next.js 16 — `npx eslint src --ext .ts,.tsx` (FIX-#44)

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
