# QA — Ticket #70 : Graphique de performance portfolio

**Date :** 2026-04-01
**Branche :** main
**Statut global :** PARTIEL — 10/12 critères validés, 2 violations à corriger

---

## Résultats par critère

### C1 — `PerformanceSection.tsx` existe dans `src/components/portfolio/`
**PASS**
Fichier présent à `/Users/ec/portfolio-dashboard/src/components/portfolio/PerformanceSection.tsx` (103 lignes).

---

### C2 — `PerformanceChart.tsx` existe dans `src/components/portfolio/` (< 200 lignes)
**PASS**
Fichier présent, 194 lignes (< 200). Limite respectée.

---

### C3 — `PerformanceTile.tsx` existe dans `src/components/portfolio/`
**PASS**
Fichier présent à `/Users/ec/portfolio-dashboard/src/components/portfolio/PerformanceTile.tsx` (61 lignes).

---

### C4 — `src/lib/quote.ts` retourne `changePercent` dans `QuoteResult`
**PASS**
Interface `QuoteResult` (ligne 22-26) inclut `changePercent?: number`. Valeur mappée depuis `meta.regularMarketChangePercent` (ligne 57).

---

### C5 — `src/app/dashboard/page.tsx` importe `PerformanceSection` (plus `AllocationSection`)
**PASS**
Ligne 10 : `import PerformanceSection from '@/components/portfolio/PerformanceSection'`. Aucun import `AllocationSection` présent dans le fichier. Section rendue ligne 62.

---

### C6 — `PerformanceChart` contient un `LineChart` et un `Treemap` (Recharts)
**PASS**
Ligne 5-7 de `PerformanceChart.tsx` : `LineChart` et `Treemap` importés depuis `recharts`. Utilisés respectivement lignes 136 et 172.

---

### C7 — Sélecteur de périodes `1M | 3M | 6M | 1A | Max` présent
**PASS**
Tableau `PERIODS` ligne 20 : `['1M', '3M', '6M', '1A', 'Max']`. Rendu en boutons lignes 115-127, actif seulement dans le tab `performance`.

---

### C8 — Deux tabs : "Performance" et "Carte"
**PASS**
Tableau `tabs` lignes 83-86 : `{ key: 'performance', label: 'Performance' }` et `{ key: 'carte', label: 'Carte' }`. Rendu en boutons lignes 94-106.

---

### C9 — La fonction `heatColor` dans `PerformanceTile.tsx` couvre les 7 couleurs (rouge → vert)
**PASS**
Les 7 paliers sont couverts :
- `c <= -5` → `#7f1d1d` (rouge très foncé)
- `c <= -2` → `#dc2626` (rouge)
- `c <= -0.5` → `#f87171` (rouge clair)
- `c < 0.5` → `#475569` (gris neutre)
- `c < 2` → `#4ade80` (vert clair)
- `c < 5` → `#16a34a` (vert)
- `else` → `#14532d` (vert foncé)

---

### C10 — `PerformanceSection` upsert dans `portfolio_snapshots` avec `onConflict`
**PASS**
Lignes 73-82 : `supabase.from('portfolio_snapshots').upsert(...)` avec `{ onConflict: 'user_id,date' }`. La contrainte porte bien sur la clé composite attendue.

---

### C11 — Aucune erreur TypeScript (`npx tsc --noEmit`)
**PASS**
`npx tsc --noEmit` — aucune sortie, aucune erreur.

---

### C12 — Aucun `style={{}}` pour des couleurs non-calculées (couleurs statiques via Tailwind/CSS vars)
**FAIL**
Deux violations détectées dans `PerformanceChart.tsx` :

**Ligne 183 — `style={{ width: 140 }}`**
Valeur calculée (`width` numérique) — tolérée par CLAUDE.md (valeur inexprima en Tailwind pur). Non bloquante.

**Ligne 185 — `style={{ background: c }}`**
La variable `c` est une couleur hex statique issue du tableau `['#7f1d1d', '#dc2626', ...]` itéré à la volée. Il s'agit d'une couleur de rendu dynamique (chaque div prend une couleur différente du tableau), ce qui est techniquement une valeur calculée. Cependant, la règle CLAUDE.md précise que `style={{}}` est toléré uniquement pour des valeurs "inexprima en Tailwind pur" — or ici il s'agit de couleurs arbitraires non issues d'un calcul métier, mais d'un tableau statique de swatches. Cas limite.

**Ligne 33 dans `PerformanceTile.tsx` — `style={{ fill: bg }}`**
`bg` est le résultat de `heatColor(changePercent)` : valeur dynamique calculée à partir d'un paramètre numérique variable. Totalement justifié et toléré par CLAUDE.md.

**Verdict C12 :** La ligne 185 de `PerformanceChart.tsx` est une violation borderline. Les couleurs hex pourraient être exprimées via des classes Tailwind arbitraires (`bg-[#dc2626]`), mais la syntaxe actuelle est fonctionnelle. A discuter avec le PO.

---

## Synthèse

| # | Critère | Statut |
|---|---------|--------|
| C1 | PerformanceSection.tsx existe | PASS |
| C2 | PerformanceChart.tsx < 200 lignes | PASS |
| C3 | PerformanceTile.tsx existe | PASS |
| C4 | changePercent dans QuoteResult | PASS |
| C5 | page.tsx importe PerformanceSection | PASS |
| C6 | LineChart + Treemap présents | PASS |
| C7 | Sélecteur 1M/3M/6M/1A/Max | PASS |
| C8 | Deux tabs Performance + Carte | PASS |
| C9 | heatColor 7 couleurs | PASS |
| C10 | upsert avec onConflict | PASS |
| C11 | Aucune erreur TypeScript | PASS |
| C12 | Pas de style={{}} statique | FAIL (borderline) |

**10 PASS / 1 FAIL borderline / 0 blocant critique**

---

## Point d'attention hors critères

`changePercent` est déclaré optionnel (`changePercent?: number`) dans `QuoteResult`. En cas d'absence de données Yahoo, la valeur tombe à `0` (fallback ligne 57 de `PerformanceSection.tsx` : `q?.changePercent ?? 0`), ce qui colorie la tuile en gris neutre (#475569). Comportement défensif correct.
