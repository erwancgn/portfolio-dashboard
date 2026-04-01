# CHANGELOG — Portfolio Dashboard IA

> Format : [Semver](https://semver.org) — MAJOR.MINOR.PATCH
> MAJOR : changement incompatible
> MINOR : nouvelle fonctionnalité
> PATCH : correction de bug

---

## [Unreleased]
> Fonctionnalités en cours de développement — pas encore livrées en version taguée.

### Added
- **Graphique performance portfolio** (#70) — Courbe de la valeur totale dans le temps (snapshots quotidiens auto-enregistrés) avec sélecteur de période YTD / 1M / 3M / 6M / 1A / Max
- **Heatmap Wall Street** (#70) — Vue carte des actions du portfolio : tuiles colorées rouge→vert selon variation 24h, tailles proportionnelles au poids (racine carrée pour lisibilité)
- **Snapshots automatiques** (#70) — Upsert quotidien dans `portfolio_snapshots` à chaque chargement du dashboard (idempotent)
- **PortfolioSummary unifié** — Meilleure/pire position et compteurs gain/perte intégrés dans la card principale ; suppression de `PnlStats` en composant séparé ; 0 doublon d'appels API (quotes fetchées une seule fois). Layout grid responsive 2→4 colonnes sur toute la largeur.
- **Positions hover reveal** — Boutons d'action (+ Achat, Vendre, DCA, Fair value) révélés au survol desktop, permanents sur mobile.
- **FairValueCell tooltip opaque** — Fix fond transparent (variable CSS inexistante) → fond solide `--color-bg-elevated`, texte complet adaptatif.

---

## [0.3.1] — 2026-03-31 — Fix Chat IA

### Fixed
- **Chat IA portfolio** — HTTP 500 `CONFIG_ERROR` corrigé : variable d'env `GEMINI_API_KEY` → `GOOGLE_AI_API_KEY` dans `/api/analyse/chat`

---

## [0.3.0] — 2026-03-30 — Analyse IA & tableau enrichi

### Added
- **Analyse rapide titre** — rendu markdown complet avec tables (remark-gfm), autocomplétion recherche (dropdown nom + ticker + type)
- **Tableau positions double-ligne** — layout card inspiré Moning : logo, nom complet, drapeau pays, métriques en ligne secondaire
- **Nom complet des actifs** — récupération automatique via FMP `companyName`, enrichissement des positions existantes au chargement
- **Pays dans le drawer** — champ pays affiché dans le panneau de détail d'une position
- **VersionBadge** — badge `v0.3.0` dans le header, modale historique des versions en langage fonctionnel
- **Responsive mobile** — cards positions en grille 2×2, header compact, PortfolioSummary adaptatif, LiquidityWidget en grille 3 colonnes
- **AnalyseSection (Poids/Secteur/Pays)** déplacée sur la page Analyse uniquement

### Fixed
- Tables markdown dans l'analyse IA affichées en texte brut → `remark-gfm` installé
- Bloc JSON `{signal, score}` visible dans l'analyse → retiré avant envoi au frontend
- Fond dropdown suggestions transparent → remplacé par `--color-bg-primary`
- Noms actifs affichant le ticker → enrichissement `name` ajouté dans `enrichPositions`

---

## [0.2.0] — 2026-03-28 — Dashboard complet

### Added
- **Graphique allocation** — donut chart Recharts par enveloppe (PEA/CTO/Crypto) et par secteur, onglets, légende avec %, intégré dans le dashboard (#52/#53)
- **ISIN/Secteur enrichi** — `/api/quote` : DB cache d'abord, puis Yahoo Finance chart + quoteSummary (summaryProfile pour actions, topHoldings.sectorWeightings pour ETF), fallback saisie manuelle
- **Secteur ETF** — extraction du secteur dominant depuis sectorWeightings Yahoo, normalisé (ex: "technology" → "Technology")
- **Vues Poids/Secteur/Pays** — AnalyseSection + AnalyseChart avec prix live, tri décroissant, barres de progression, onglets (#18/#20)
- **Vue Pays** — déduction du pays depuis le suffix ticker (.PA→France, .MI→Italie, etc.)
- **Module `src/lib/yahoo.ts`** — fetchYahooChart, fetchYahooSector, types YahooChartMeta/YahooApiError, mapping SECTOR_LABELS
- **Agents IA** — ux-agent (designer fintech), skill design-review, skill finance-formulas
- **shadcn/ui** — composants `Dialog`, `Sheet`, `Table` disponibles dans `src/components/ui/`, lib `cn()` dans `src/lib/utils.ts` (#51)
- **Transactions atomiques** — RPCs PostgreSQL `buy_position` et `sell_position` : PRU + historique en une seule transaction SQL (#47)
- **Vente partielle ou totale** — `SellButton` avec formulaire qty + prix, prévisualisation P&L + taxe + net en temps réel (#47/#55)
- **Fiscalité automatique** — flat tax 30% appliquée à la vente sur CTO/Crypto, 0% sur PEA (#55)
- **Liquidités par enveloppe** — table `liquidities`, widget dashboard total + PEA + CTO/Autre, `DepositButton` pour apports/retraits manuels (#55)
- **Page Historique** — `/dashboard/historique` avec filtres date, badges Achat/Vente/Apport/Retrait, colonne Taxe (#47/#55)
- **Refonte UI/UX** — thème light blanc/noir/bleu, hero valeur portfolio, PnlStats compact, tableau 5 colonnes + Sheet drawer détails, formulaire en Dialog modale (#50)
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
- **Rafraîchissement automatique des prix** — polling toutes les 60s via `setInterval` → `router.refresh()`, sans rechargement de page (US-005)
- **Composant `PortfolioSummary`** — Server Component affiché en haut du dashboard : total investi, valeur actuelle, P&L global (€ et %), nombre de positions (US-006)
- **Lib `src/lib/quote.ts`** — `fetchQuote`, `fetchRate`, `toEur` en source unique, wrappés avec `cache()` React 19 pour zéro doublon d'appel réseau
- **Lib `src/lib/format.ts`** — `formatEur` et `formatPct` en source unique

### Fixed
- Remplacement de tous les `style={{}}` inline par des classes Tailwind v4 (FIX-001)
- Script `npm run lint` corrigé pour Next.js 16 — `npx eslint src --ext .ts,.tsx` (FIX-#44)
- Migration Finnhub → Yahoo Finance : couverture mondiale US + EU + crypto, sans clé API
- `PositionsTable` : fetch HTTP interne remplacé par requête Supabase directe (cookies d'auth non transmis via fetch)
- Conversion devise : prix USD/GBp/GBP convertis en EUR via Frankfurter avant affichage
- Dropdown suggestions : ne rouvre plus après sélection d'une suggestion
- ISIN : auto-rempli depuis la sélection d'une suggestion si Yahoo Finance le retourne
- Polish UI : tokens CSS cohérents, `tabular-nums` sur chiffres, hiérarchie visuelle

### Known Issues
- `fetchYahooSector()` échoue silencieusement — Yahoo exige un crumb (cookie + CSRF) pour `/quoteSummary` → secteur vide à l'ajout de position

---

## [0.1.0] — 2026-03-25 — MVP en ligne

### Added
- **Suppression de position** — bouton par ligne avec confirmation, feedback erreur visible (US-004)
- **Supabase production** — base de données prod sur supabase.com, migrations appliquées, RLS actif
- **Déploiement Vercel** — app en production sur https://portfolio-zeta-fawn-73.vercel.app

---

## Versions livrées

| Version | Date | Statut |
|---------|------|--------|
| [0.2.0] | 2026-03-28 | ✅ Dashboard complet — allocation, vues, transactions, fiscalité, UI refonte |
| [0.1.0] | 2026-03-25 | ✅ Déployé sur Vercel — MVP (auth, positions, prix temps réel) |

---

## Comprendre le versioning

| Version | Signification | Exemple |
|---|---|---|
| 1.0.0 | MVP livré et validé | Premier dashboard fonctionnel |
| 1.1.0 | Nouvelle fonctionnalité | Ajout de l'agent surveillance |
| 1.1.1 | Bug corrigé | Fix calcul PRU incorrect |
| 2.0.0 | Refonte majeure | Migration vers nouvelle stack |
