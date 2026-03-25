# Rapport QA — Session 10

Date : 2026-03-25
Auditeur : Claude Code (QA)
Branche : main (commit 8035d60)

---

## Résultat TypeScript

`npx tsc --noEmit` : **aucune erreur** — sortie vide, compilation propre.

---

## US-003 — Ajouter un achat sur position existante

### Fichiers audités
- `src/app/api/positions/[id]/route.ts` (151 lignes)
- `src/components/positions/AddBuyButton.tsx` (134 lignes)
- `src/components/positions/PositionsTable.tsx` (137 lignes)

### Critères

1. **PASS** — Handler PATCH présent. Formule PRU correcte ligne 84 :
   `(oldQuantity * oldPru + quantity * purchasePrice) / newQuantity`
   correspond exactement à la formule de référence CLAUDE.md.

2. **PASS** — Validation côté serveur aux lignes 53-63 : vérification
   `typeof quantity !== 'number'`, `typeof purchasePrice !== 'number'`,
   `quantity <= 0`, `purchasePrice <= 0` — retourne 400.

3. **PASS** — Recalcul PRU exclusivement côté serveur dans le handler PATCH.
   Le composant `AddBuyButton` délègue entièrement au PATCH et n'effectue
   aucun calcul financier.

4. **PASS** — Bouton `+ Achat` présent dans la colonne Actions de
   `PositionsTable.tsx` (ligne 126) via `<AddBuyButton id={pos.id} ticker={pos.ticker} />`.

5. **PASS** — Mini-formulaire inline avec deux inputs distincts :
   "Quantité achetée" (ligne 87-98) et "Prix d'achat" (ligne 99-110).

6. **PASS** — `router.refresh()` appelé ligne 59 après `res.ok`.

7. **PASS** — Aucun `any` TypeScript détecté (les `step="any"` sont des
   attributs HTML valides). Aucun `style={{}}`. Tous les fichiers < 200 lignes.

### Bilan US-003 : 7/7 PASS

---

## US-010 — P&L détaillé

### Fichiers audités
- `src/components/portfolio/PnlStats.tsx` (111 lignes)
- `src/components/positions/PositionsTable.tsx` (137 lignes)
- `src/app/dashboard/page.tsx` (51 lignes)

### Critères

1. **PASS** — `PnlStats.tsx` est un Server Component : pas de `"use client"`,
   fonction `async`, import direct Supabase server.

2. **PASS** — Requête Supabase directe via `createClient()` (ligne 13).
   Aucun `fetch /api/*` interne.

3. **FAIL** — Les 4 StatCards sont présentes visuellement (meilleure position,
   pire position, en gain, en perte), mais elles ne sont pas des composants
   `<StatCard>` réutilisables — ce sont des `<div>` inline. Le critère mentionne
   "4 StatCards présentes" : si l'intention est un composant nommé `StatCard`,
   celui-ci n'est pas utilisé. Si le critère vise simplement 4 blocs de stat,
   ils sont bien présents.
   **Ambiguïté signalée — à clarifier avec le PO.**

4. **PASS** — Couleur `text-green-500` appliquée sur la meilleure position
   (ligne 68) et le compteur "en gain" (ligne 89). Couleur `text-red-500`
   appliquée sur la pire position (ligne 80) et le compteur "en perte" (ligne 101).

5. **PASS** — `PnlStats` placé ligne 36 dans `dashboard/page.tsx`, entre
   `<PortfolioSummary />` (ligne 34) et le bloc formulaire `PositionsSectionClient`
   (ligne 39). Ordre correct.

6. **PASS** — Tri du tableau par P&L décroissant dans `PositionsTable.tsx`
   lignes 51-58 : `return pnlB - pnlA`. Le tri porte bien sur le P&L
   (différence valeur - investi), pas sur la valeur brute.

7. **FAIL** — `formatPct` est importé dans `PositionsTable.tsx` (ligne 3)
   mais **non importé dans `PnlStats.tsx`**. `PnlStats.tsx` importe uniquement
   `formatEur` (ligne 3). Aucun pourcentage P&L n'est affiché dans `PnlStats.tsx`.
   Le critère demande `formatPct` importé depuis `@/lib/format` dans ce fichier.

8. **PASS** — `fetchQuote` et `fetchRate` importés depuis `@/lib/quote`
   (ligne 2 de `PnlStats.tsx`). Aucune redéfinition locale.

### Bilan US-010 : 6/8 (2 points à clarifier/corriger)

---

## TECH — ISIN / Ticker / Nom / Secteur

### Fichiers audités
- `src/app/api/quote/route.ts` (146 lignes)
- `src/app/api/positions/route.ts` (146 lignes)
- `src/components/positions/AddPositionForm.tsx` (140 lignes)
- `src/components/positions/useAddPositionForm.ts` (173 lignes)
- `src/components/positions/SearchInput.tsx` (166 lignes)
- `src/components/positions/PositionsTable.tsx` (137 lignes)

### Critères

1. **PASS** — `QuoteResponse` (ligne 4-12 de `/api/quote/route.ts`) contient
   `sector?: string`.

2. **PASS** — `/api/quote` effectue un appel `quoteSummary` Yahoo Finance
   (lignes 87-98) sur le module `summaryProfile`. Le secteur est optionnel :
   l'échec du second appel est silencieux (`catch {}`) et ne bloque pas la
   réponse principale.

3. **PASS** — `sector` inclus dans l'interface `CreatePositionBody` (ligne 16)
   et dans le payload `insert` (ligne 92) du POST `/api/positions`.

4. **PASS** — Colonne "Secteur" présente dans le `<thead>` de `PositionsTable.tsx`
   (ligne 73) et affichée dans chaque ligne (ligne 106) : `{pos.sector ?? '—'}`.

5. **PASS** — `handleSuggestionSelected` dans `useAddPositionForm.ts`
   (lignes 99-113) : après sélection d'une suggestion, un appel `/api/quote`
   est déclenché et `sector` est rempli si disponible (`data.sector`).

6. **PASS** — `handleTickerBlur` dans `useAddPositionForm.ts` (lignes 81-96) :
   au blur du champ Ticker, lookup `/api/quote`, puis `isin` et `sector` sont
   remplis si disponibles et non déjà renseignés. `SearchInput.tsx` expose bien
   la prop `onBlur?: () => void` (ligne 16) et l'appelle via `handleBlur`
   (lignes 107-112).

7. **PASS** — Aucun `any` TypeScript détecté. Aucun `style={{}}`. Tous les
   fichiers < 200 lignes.

### Bilan TECH : 7/7 PASS

---

## Récapitulatif global

| Feature | Score | Statut |
|---------|-------|--------|
| US-003 Ajout achat | 7/7 | PASS complet |
| US-010 P&L détaillé | 6/8 | 2 anomalies |
| TECH ISIN/Secteur/Ticker | 7/7 | PASS complet |

---

## Anomalies à corriger

### ANO-1 (US-010 critère 7) — `formatPct` absent de `PnlStats.tsx`
**Sévérité : Moyenne**
`PnlStats.tsx` n'importe pas `formatPct` et n'affiche aucun pourcentage P&L
par position. Le critère US-010 exige explicitement `formatPct` importé depuis
`@/lib/format` dans ce composant.
Fichier : `src/components/portfolio/PnlStats.tsx` ligne 3.

### ANO-2 (US-010 critère 3) — Ambiguïté sur "StatCards"
**Sévérité : Faible / À clarifier**
Le critère mentionne "4 StatCards présentes". Aucun composant `<StatCard>`
n'est utilisé ou importé dans `PnlStats.tsx` — les blocs sont des `<div>`
inline. Si le ticket exige le composant `StatCard` existant dans le projet,
c'est une non-conformité. À valider avec le PO.

---

## Conventions projet (CLAUDE.md)

- Pas de `style={{}}` dans les fichiers audités. PASS
- Pas de TypeScript `any` dans les fichiers audités. PASS
- Tous les fichiers audités sont < 200 lignes. PASS
- Appels API externes uniquement dans `src/app/api/*`. PASS
- Server Components pour les pages, Client Components uniquement si interaction. PASS
- `fetchQuote` / `fetchRate` non redéfinis localement. PASS
