# Rapport QA — Passe complète Session 6
Issues GitHub : #44 (FIX), #12 (US-001), #13 (US-002), #43 (TASK-043 /api/quote name)
Date : 2026-03-23

---

## Pré-checks

- Build : PASS (compilé avec succès en 5.4s, 9 pages générées)
  - 2 warnings CSS ignorables (Tailwind v4 — classes `var(--color-*)` avec wildcard dans le CSS optimisé — faux positif connu)
- TypeScript : PASS (npx tsc --noEmit — 0 erreur)
- Lint : PASS (npm run lint — exit code 0, 0 warning)

---

## FIX-#44 — Corriger le script lint dans package.json

| # | Critère (depuis le ticket GitHub) | Statut | Détail |
|---|----------------------------------|--------|--------|
| CA1 | `npm run lint` s'exécute sans erreur | PASS | Exit code 0, aucune sortie d'erreur |
| CA2 | `npm run lint` utilisable par l'agent test | PASS | Commandé et vérifié dans les pré-checks |

Script dans package.json ligne "lint" : `npx eslint src --ext .ts,.tsx`
Conforme à la demande du ticket (utilise `npx eslint src/ --ext .ts,.tsx`).
Légère différence syntaxique (`src` vs `src/`) — fonctionnellement équivalent, ESLint accepte les deux.

**Verdict FIX-#44 : PASS**

---

## US-001 (#12) — Ajouter une position manuellement

### Critères d'acceptation (ticket GitHub)

| # | Critère | Statut | Détail |
|---|---------|--------|--------|
| CA1 | Formulaire avec tous les champs | PASS | 7 champs présents : Ticker, Nom, Type, Quantité, PRU, Enveloppe, Devise |
| CA2 | Ticker + Tab → auto-complétion Finnhub | PARTIAL | Debounce 500ms implémenté dans TickerInput.tsx, mais le déclencheur est "frappe après 500ms d'inactivité" et non "Tab". Le nom est auto-rempli via onValidated(). Le comportement Tab n'est pas explicitement géré. |
| CA3 | Validation champs obligatoires | PASS | Ticker, type, quantité, PRU marqués required. Validation côté API (POST /api/positions) sur tous les champs obligatoires avec status 400. |
| CA4 | Message succès après enregistrement | PASS | `setStatus('success')` + message "Position ajoutée avec succès." affiché en vert (AddPositionForm.tsx l. 86) |
| CA5 | Position visible dans le tableau | PASS | `onPositionAdded()` appelle `router.refresh()` (PositionsSectionClient.tsx l. 15), ce qui force le rechargement du Server Component PositionsTable |

### Vérifications spécifiques (critères de la passe session 6)

**API POST /api/positions :**
- Route présente dans `src/app/api/positions/route.ts` — PASS
- Authentification vérifiée via `supabase.auth.getUser()` — PASS
- Validation 4 champs obligatoires (ticker, type, quantity, pru) — PASS
- Gestion d'erreur try/catch + status codes (400, 401, 500) — PASS
- Aucune clé secrète exposée côté client — PASS

**API GET /api/positions :**
- Route présente, authentifiée, triée par `created_at` décroissant — PASS
- Retourne tableau vide si aucune position — PASS

**AddPositionForm — 6 champs + name auto-rempli :**
- Champs présents : ticker, type, quantity, pru, envelope, currency = 6 champs fonctionnels PASS
- Champ name présent (7ème champ, affiché mais non obligatoire) — PASS
- `handleTickerValidated` remplit automatiquement `form.name` depuis la réponse /api/quote — PASS
- Zéro style inline `style={{}}` — PASS (vérifié par grep, aucun résultat)

**TickerInput — debounce 500ms + feedback visuel :**
- Debounce via `setTimeout(..., 500)` avec `clearTimeout` — PASS (TickerInput.tsx l. 30-50)
- Feedback "Vérification…" pendant la requête — PASS (l. 77-79)
- Feedback "✓ nom" en vert si valide — PASS (l. 80-82)
- Feedback "Ticker introuvable" en rouge si invalide — PASS (l. 83-85)

**Verdict US-001 : PASS avec réserve**
Réserve : CA2 — l'auto-complétion se déclenche après 500ms de frappe et non sur Tab. L'intent du ticket ("Ticker + Tab") n'est pas strictement respecté. Fonctionnellement acceptable mais diverge du critère littéral.

---

## US-002 (#13) — Voir la liste de ses positions

### Critères d'acceptation (ticket GitHub)

| # | Critère | Statut | Détail |
|---|---------|--------|--------|
| CA1 | Colonnes : Ticker · Nom · Quantité · PRU · Prix actuel · Valeur · P&L € · P&L % · Poids % | FAIL | La colonne "Nom" est absente du tableau. Colonnes présentes : Ticker, Type, Quantité, PRU, Prix actuel, Valeur, P&L (€), P&L (%), Poids. Type est présent mais pas Nom. |
| CA2 | P&L positif vert, négatif rouge | PASS | `pnlColor` = `text-green-500` si pnl >= 0, `text-red-500` sinon (l. 123-128) |
| CA3 | Tri par colonne | FAIL | Seul un tri fixe par valeur décroissante est implémenté (l. 87-91). Aucun tri interactif par clic sur colonne. Le composant est un Server Component, donc sans état client pour le tri. |
| CA4 | Responsive mobile | PARTIAL | `overflow-x-auto` présent (l. 99) — défilement horizontal sur mobile. Pas de breakpoints responsive spécifiques (sm:/md:) pour masquer des colonnes. Acceptable comme implémentation minimale. |

### Vérifications des calculs financiers (CLAUDE.md)

Formules de référence vs implémentation (PositionsTable.tsx l. 117-121) :

| Formule | Référence CLAUDE.md | Implémentation | Conforme |
|---------|---------------------|----------------|---------|
| Valeur position | quantité × prix_actuel | `pos.quantity * pos.currentPrice` (l. 117) | PASS |
| Valeur investie | quantité × pru | `pos.quantity * pos.pru` (l. 118) | PASS |
| P&L | valeur - valeur_investie | `valeur - invested` (l. 119) | PASS |
| P&L % | (P&L / valeur_investie) × 100 | `(pnl / invested) * 100` (l. 120) | PASS |
| Poids % | (valeur / valeur_totale) × 100 | `(valeur / totalValue) * 100` (l. 121) | PASS |

Cas limites :
- Division par zéro dans P&L % : si `invested = 0` (quantity=0 ou pru=0), division par zéro possible. Cependant, l'API POST valide `quantity > 0` et `pru > 0`, donc cas théoriquement impossible en production.
- Division par zéro dans Poids% : protégé par `totalValue > 0` (l. 121) — PASS.
- Position sans prix : toutes les formules protégées par `hasPrice !== null` — PASS.

**Verdict US-002 : FAIL**
- CA1 : colonne "Nom" manquante dans le tableau (le champ `name` existe en DB et dans le formulaire mais n'est pas affiché)
- CA3 : tri interactif par colonne absent (seulement tri fixe par valeur décroissante)

---

## /api/quote — Retourne le champ name

| Vérification | Statut | Détail |
|-------------|--------|--------|
| Interface QuoteResponse expose `name` | PASS | `name: string` présent dans l'interface exportée (route.ts l. 6) |
| Stocks : name depuis profil Finnhub | PASS | `fetchStockPrice` appelle `/stock/profile2` en parallèle et retourne `profile?.name ?? ticker.toUpperCase()` (l. 75) |
| Crypto : name capitalisé | PASS | `coinId.charAt(0).toUpperCase() + coinId.slice(1)` (l. 117) — ex: "bitcoin" → "Bitcoin" |
| Fallback si profil Finnhub absent | PASS | `profile?.name ?? ticker.toUpperCase()` — retourne le ticker en majuscules |
| Clé FINNHUB_API_KEY côté serveur uniquement | PASS | `process.env.FINNHUB_API_KEY` sans préfixe NEXT_PUBLIC_ (l. 44) |

**Verdict /api/quote name : PASS**

---

## Régression

| Point | Statut | Détail |
|-------|--------|--------|
| `src/proxy.ts` existe (pas middleware.ts) | PASS | Fichier présent, 62 lignes |
| `src/lib/supabase/client.ts` exporte createClient (browser) | PASS | Vérifié |
| `src/lib/supabase/server.ts` exporte createClient (server) | PASS | Vérifié |
| `/auth/login` route accessible | PASS | Route compilée (○ /auth/login dans le build) |
| Pas de clé API dans le code côté client | PASS | FINNHUB_API_KEY et COINGECKO_API_KEY uniquement dans src/app/api/ |
| `npm run build` passe | PASS | Build réussi |
| `npx tsc --noEmit` passe | PASS | 0 erreur TypeScript |

---

## Conventions

| Règle | Statut | Détail |
|-------|--------|--------|
| Pas de `any` TypeScript | PASS | Grep sur `: any` — 0 résultat |
| Pas de `style={{}}` inline | PASS | Grep sur `style=\{\{` — 0 résultat |
| Pas de `NEXT_PUBLIC_` sur une clé secrète | PASS | `NEXT_PUBLIC_APP_URL` dans PositionsTable.tsx est une URL d'app (non secrète). `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont des clés publiques Supabase par design (anon key). |
| Fichiers < 200 lignes | PASS | Tous les fichiers source dans les limites. `src/types/database.ts` (418 lignes) est auto-généré — exempté. |
| Nommage camelCase/PascalCase/kebab-case | PASS | Composants PascalCase, fichiers kebab-case, variables camelCase |
| JSDoc sur fonctions dans src/lib/ | PASS | Vérifié sur server.ts et client.ts |

---

## Leçons capturées

[S6-01] `PositionsTable` est un Server Component pur — il ne peut pas implémenter un tri interactif par colonne sans être converti en Client Component ou sans extraire la logique de tri dans un wrapper client. Tout ticket demandant un "tri par colonne" sur un Server Component doit anticiper ce découpage architectural.

[S6-02] Le ticket US-002 spécifie la colonne "Nom" mais la PositionsTable n'affiche pas `pos.name` alors que le champ existe en DB (`database.ts` l. 197). Divergence silencieuse entre le schéma DB, le formulaire et le tableau d'affichage.

---

## Verdict global

FAIL

Blocants :
1. US-002 CA1 : colonne "Nom" absente du tableau PositionsTable
2. US-002 CA3 : tri interactif par colonne absent (tri fixe uniquement)

Non-blocants :
- US-001 CA2 : l'auto-complétion Finnhub fonctionne mais se déclenche sur inactivité de frappe (debounce 500ms) et non sur Tab — fonctionnellement acceptable, diverge du critère littéral
- US-002 CA4 : responsive partiel via overflow-x-auto, sans masquage de colonnes sur mobile
