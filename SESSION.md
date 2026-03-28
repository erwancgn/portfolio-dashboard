# SESSION.md — Session 13

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Session 12 — Clôturée ✅ (28/03/2026)

| Ticket | Titre | Statut |
|--------|-------|--------|
| TECH | ISIN/Secteur — enrichissement Yahoo + DB cache | ✅ Livré |
| #52/#53 | Graphique allocation (donut Recharts) | ✅ Livré |
| #18 | Vue Poids | ✅ Livré |
| #20 | Vue Secteur | ✅ Livré |
| NEW | Vue Pays (suffix ticker) | ✅ Livré |
| UX | Polish complet app (tokens CSS, tabular-nums, hierarchy) | ✅ Livré |
| TECH | Extraction src/lib/yahoo.ts | ✅ Livré |
| AGENTS | ux-agent, design-review skill, finance-formulas skill | ✅ Livré |

---

## 🐛 Bug prioritaire S13 — À traiter en PREMIER

**Symptôme** : recherche par nom (ex: "Amazon") → seul le ticker est remonté dans le formulaire, pas le secteur.

**Cause identifiée** : Yahoo Finance exige désormais un **crumb** (cookie `fc.yahoo.com` + token CSRF) pour l'endpoint `quoteSummary` — les appels sans crumb retournent `401 Unauthorized` ou `404 Not Found`.

**Flux impacté** : `fetchYahooSector()` dans `src/lib/yahoo.ts` → appelle `/v10/finance/quoteSummary` sans crumb → retourne `undefined` → champ Secteur vide.

**Fix à implémenter** :
1. Fetch `https://fc.yahoo.com/` pour obtenir les cookies de session
2. Fetch `https://query1.finance.yahoo.com/v1/test/getcrumb` avec ces cookies → crumb
3. Ajouter `crumb=<value>` en query param + cookies dans les headers de `fetchYahooSector`
4. Mettre en cache le crumb (durée de vie ~1h)

---

## Objectif Session 13 — Refonte graphique totale

### Référence UX
**Moning** : https://moning.co/dashboard/portfolio/5d5b7bf2-c378-4f8f-b7db-c6403a16131c
Mix Trade Republic (minimalisme) + Moning (features investisseur FR)

### Tickets

| # | Titre | Priorité |
|---|-------|----------|
| #56 | EPIC 14 — Refonte dashboard : bandeau récap + tableau | P1 |
| #57 | EPIC 15 — Page Analyse : vues + chat IA portfolio | P1 |
| #58 | EPIC 16 — Page Analyse Titre : quick/standard/full | P1 |
| #59 | FEAT — DCA depuis tableau principal | P1 |

---

## Plan technique S13

### Page Dashboard (refonte #56)
**Bandeau récap (hero)** : Valeur totale / Plus-value (€+%) / Valeur investie / Nb positions
**Tableau positions** : tri par colonne, bouton DCA par ligne, Achat/Vente inline

### Page Analyse (#57) — `/dashboard/analyse`
- Déplacer AllocationSection + AnalyseSection depuis dashboard
- Chat IA : Claude API avec contexte portfolio (positions + P&L + allocation)
- Agent : accès positions, historique, secteurs → répond en français

### Page Analyse Titre (#58) — `/dashboard/analyse/[ticker]`
- Quick (Haiku) : résumé 3 lignes + signal HOLD/BUY/SELL
- Standard (Sonnet) : analyse technique + fondamentale + risques
- Full (Opus) : analyse institutionnelle complète + scénarios

### Feature DCA (#59)
- Bouton DCA sur chaque ligne du tableau → Sheet/Dialog
- Champs : montant €, rythme, date première exécution, enveloppe
- Table DB `dca_rules`, lié à `transactions`
- Ferme #4, #22, #23, #24

---

## Stack en place

- Auth Supabase ✅ · Yahoo Finance `/api/quote` + `/api/search` ✅
- `AllocationChart` (donut Recharts) ✅ · `AnalyseChart` (Poids/Secteur/Pays) ✅
- `PortfolioSummary` hero ✅ · `PnlStats` compact ✅ · `LiquidityWidget` ✅
- Transactions atomiques (RPCs PostgreSQL) ✅ · Historique `/dashboard/historique` ✅
- Fiscalité flat tax 30% CTO/Crypto, 0% PEA ✅ · Thème light blanc/noir/bleu ✅
- `src/lib/yahoo.ts` (fetchYahooChart, fetchYahooSector) ✅
- ux-agent + design-review skill + finance-formulas skill ✅
- Production : https://portfolio-zeta-fawn-73.vercel.app ✅

## Fichiers clés

```
src/app/dashboard/page.tsx
src/app/dashboard/historique/page.tsx
src/components/portfolio/PortfolioSummary.tsx    ← hero valeur
src/components/portfolio/AllocationSection.tsx   ← donut enveloppe/secteur
src/components/portfolio/AnalyseSection.tsx      ← Poids/Secteur/Pays live
src/components/portfolio/AnalyseChart.tsx        ← Client tabs
src/components/positions/PositionsTableView.tsx  ← tableau + Sheet drawer
src/lib/yahoo.ts                                 ← fetchYahooChart, fetchYahooSector
src/lib/quote.ts                                 ← fetchQuote + fetchRate (React cache)
src/types/database.ts                            ← types générés Supabase
```

---

## Protocole de validation

Après chaque US/TASK : appel obligatoire au `test-agent` avant de considérer le ticket terminé.

---

*Mis à jour : clôture Session 12 — 28/03/2026*
