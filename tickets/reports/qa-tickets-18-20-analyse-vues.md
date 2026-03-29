# Rapport QA — #18 Vue Poids + #20 Vue Secteur + Vue Pays
Issues GitHub : #18, #20
Date : 2026-03-28

## Pré-checks
- Build : PASS (12 routes générées, 0 erreur TypeScript à la compilation)
- TypeScript : PASS (npx tsc --noEmit sans sortie = aucune erreur)
- Lint : PASS (npm run lint sans avertissement)

Note : 2 warnings CSS du build ("Unexpected token Delim('*')") sont des faux positifs liés à Tailwind v4 et n'affectent pas le comportement.

---

## Critères d'acceptation

### Ticket #18 — Vue Poids

| # | Critère (depuis le ticket GitHub) | Statut | Détail |
|---|----------------------------------|--------|--------|
| CA1 | 3 vues : Liste · Barres · Camembert | PARTIEL | Implémentée en vue Liste uniquement avec barre de progression intégrée. Pas de vue Barres distincte ni de vue Camembert. |
| CA2 | Trié par valeur décroissante | PASS | `toSortedRows` trie via `.sort((a, b) => b.value - a.value)` |
| CA3 | Poids % + valeur € | PASS | `row.pct.toFixed(1) %` + `formatEur(row.value)` affichés sur chaque ligne |
| DOD | Poids somme à 100% | PASS (logique) | `pct = (value / total) * 100`, guard `total > 0` présent. La somme des pct est garantie à 100% mathématiquement si total > 0. |

### Ticket #20 — Vue Secteur

| # | Critère (depuis le ticket GitHub) | Statut | Détail |
|---|----------------------------------|--------|--------|
| CA1 | Agrégation par secteur | PASS | `bySector.set(sector, ...)` avec fallback `'Non classé'` pour `null` |
| CA2 | 3 vues : Liste · Barres · Camembert | PARTIEL | Même limitation que #18 : vue Liste uniquement, pas de vue Barres ni Camembert |
| CA3 | P&L par secteur | FAIL | Absent. La valeur affichée est la valeur investie (quantité × PRU), pas le P&L. Le P&L nécessiterait le prix_actuel, absent de la requête. |

### Vue Pays (critères de l'argument de vérification)

| # | Critère | Statut | Détail |
|---|---------|--------|--------|
| VP1 | .PA → France | PASS | ligne 17 |
| VP2 | .MI → Italie | PASS | ligne 18 |
| VP3 | .L → Royaume-Uni | PASS | ligne 19 |
| VP4 | .AS → Pays-Bas | PASS | ligne 20 |
| VP5 | tiret → Crypto | PASS | ligne 16, `ticker.includes('-')` |
| VP6 | sans suffix → États-Unis | PASS | ligne 24, fallback final |

---

## Vérifications spécifiques

### Calculs financiers

La valeur calculée est `quantité × PRU` (valeur investie), conformément aux formules CLAUDE.md.
Le P&L (`valeur_position - valeur_investie`) n'est PAS calculé, car `prix_actuel` n'est pas dans la requête.
Pour le ticket #18 (Poids) et la Vue Pays, ce choix est cohérent : le poids en valeur investie est valide.
Pour le ticket #20 (Secteur), le critère CA3 "P&L par secteur" n'est donc pas rempli.

Division par zéro : protégée par `total > 0 ? (value / total) * 100 : 0` — PASS.

### Architecture Server/Client Component

AnalyseSection.tsx :
- Absence de directive `'use client'` : confirme Server Component — PASS
- Requête via `createClient()` de `@/lib/supabase/server` : conforme — PASS
- Aucun `fetch` vers une API route interne : conforme à la leçon S7 — PASS

AnalyseChart.tsx :
- Directive `'use client'` présente en ligne 1 : conforme — PASS
- Utilise `useState` pour la gestion d'onglet : justifie le Client Component — PASS

### Intégration dashboard

`AnalyseSection` est importé et rendu dans `src/app/dashboard/page.tsx` ligne 10 et ligne 51 — PASS.

---

## Régression

- `src/lib/supabase/client.ts` : non modifié, import toujours présent dans d'autres composants — PASS
- `src/lib/supabase/server.ts` : utilisé dans AnalyseSection et dashboard/page.tsx — PASS
- `/auth/login` : route statique toujours présente dans le build (`○ /auth/login`) — PASS
- `src/proxy.ts` : fichier toujours présent et référencé (`ƒ Proxy (Middleware)` dans le build) — PASS
- Tous les autres composants portfolio (PortfolioSummary, PnlStats, LiquidityWidget, AllocationSection) restent inchangés et présents — PASS

---

## Conventions

### Violations trouvées

**VIOLATION — style inline (`style={{}}`) dans AnalyseChart.tsx ligne 58 :**
```
style={{ width: `${Math.min(row.pct, 100)}%` }}
```
Ce style dynamique (largeur calculée à l'exécution) ne peut pas être exprimé avec une classe Tailwind statique. C'est la raison technique habituelle d'une telle exception, mais la règle CLAUDE.md l'interdit explicitement sans exception mentionnée.

### Conformités vérifiées
- Aucun `any` TypeScript dans les deux fichiers — PASS
- Aucun `NEXT_PUBLIC_` sur une clé secrète — PASS
- Fichiers < 200 lignes : AnalyseSection 91 lignes, AnalyseChart 107 lignes — PASS
- Nommage : `AnalyseSection` / `AnalyseChart` (PascalCase composants), `getCountry` / `toSortedRows` / `weightData` (camelCase variables), fichiers `analyse-section.tsx` NON — les fichiers sont nommés `AnalyseSection.tsx` et `AnalyseChart.tsx` (PascalCase) alors que la convention est kebab-case. Ceci est cohérent avec le reste du projet (AllocationSection.tsx, AllocationChart.tsx) : pattern établi, non isolé.

---

## Leçons capturées

[S12] La barre de progression dynamique (`width: X%`) ne peut pas être exprimée avec Tailwind pur car les valeurs sont calculées à l'exécution. Ce pattern récurrent (voir AllocationChart.tsx) justifie une exception documentée dans CLAUDE.md ou l'utilisation d'une CSS custom property inline. Règle à préciser : `style={{}}` autorisé uniquement pour les propriétés CSS dont la valeur est calculée dynamiquement et impossible à exprimer avec une classe Tailwind.

[S12] Les noms de fichiers composants React dans ce projet suivent la convention PascalCase (ex: AnalyseSection.tsx) alors que CLAUDE.md prescrit le kebab-case. L'incohérence est systémique (tous les composants portfolio sont en PascalCase). La règle CLAUDE.md devrait être mise à jour pour refléter la pratique réelle ou une migration cohérente décidée.

---

## Verdict
FAIL partiel

Raisons :
1. CA1 (#18) et CA2 (#20) : les 3 vues demandées (Liste, Barres, Camembert) ne sont PAS implémentées. Seule la vue Liste est présente (avec une barre de progression intégrée, non une vue Barres distincte).
2. CA3 (#20) : le P&L par secteur est absent — la valeur affichée est la valeur investie, pas le P&L.
3. Convention CLAUDE.md : 1 violation `style={{}}` (ligne 58 AnalyseChart.tsx), justifiée techniquement mais non autorisée.

Ce qui passe sans réserve : tri décroissant, valeur €, %, intégration dashboard, architecture Server/Client, TypeScript strict, build, lint, getCountry() complet.
