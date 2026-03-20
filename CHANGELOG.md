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

### Fixed
- Remplacement de tous les `style={{}}` inline par des classes Tailwind v4 (FIX-001)

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
