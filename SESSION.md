# SESSION.md — Session 12

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Session 11 — Clôturée ✅ (28/03/2026)

| Ticket | Titre | Statut |
|--------|-------|--------|
| #51 TASK | Setup shadcn/ui | ✅ Livré |
| #47 TASK | Transactions atomiques (buy/sell RPCs) | ✅ Livré |
| #50 EPIC 13 | Refonte UI/UX — light theme + drawer | ✅ Livré |
| #55 TASK | Liquidités + fiscalité + apports | ✅ Livré |

---

## Objectif Session 12

| Ticket | Titre | Priorité |
|--------|-------|----------|
| TECH | ISIN/Secteur — fiabiliser Yahoo Finance | P1 |
| NEW | Graphique allocation (camembert enveloppe/secteur) | P2 |

---

## Stack en place

- Auth Supabase ✅ · Yahoo Finance `/api/quote` + `/api/search` ✅
- `AddPositionForm` (ISIN + suggestions) ✅ · `PositionsTable` + `PositionsTableView` ✅
- `PortfolioSummary` hero ✅ · `PnlStats` compact ✅ · `LiquidityWidget` ✅
- Polling auto 60s ✅ · shadcn/ui Dialog/Sheet/Table ✅
- Transactions atomiques (RPCs PostgreSQL) ✅ · Historique `/dashboard/historique` ✅
- Fiscalité flat tax 30% CTO/Crypto, 0% PEA ✅
- Thème light blanc/noir/bleu ✅
- Production : https://portfolio-zeta-fawn-73.vercel.app ✅

## Fichiers clés

```
src/app/dashboard/page.tsx
src/app/dashboard/historique/page.tsx
src/app/api/positions/[id]/route.ts          ← PATCH buy_position RPC
src/app/api/positions/[id]/sell/route.ts     ← POST sell_position RPC
src/app/api/liquidities/route.ts             ← POST deposit_liquidity RPC
src/components/positions/PositionsTable.tsx  ← Server Component → PositionsTableView
src/components/positions/PositionsTableView.tsx ← Client, tableau + Sheet drawer
src/components/positions/AddBuyButton.tsx
src/components/positions/SellButton.tsx      ← prévisualisation P&L + taxe
src/components/portfolio/PortfolioSummary.tsx
src/components/portfolio/PnlStats.tsx
src/components/portfolio/LiquidityWidget.tsx
src/components/portfolio/DepositButton.tsx
src/components/transactions/TransactionsTable.tsx
src/lib/quote.ts                             ← fetchQuote + fetchRate (React cache())
src/lib/format.ts                            ← formatEur + formatPct
supabase/migrations/                         ← 3 nouvelles migrations S11
src/types/database.ts                        ← regénéré avec types RPC complets
```

---

## Plan technique S12

**TECH — ISIN/Secteur**
Yahoo Finance `quoteSummary` ne retourne pas toujours l'ISIN ni le secteur.
Pistes : enrichir `/api/quote` avec fallback OpenFIGI pour l'ISIN, ou saisie manuelle obligatoire.

**Graphique allocation**
Camembert par enveloppe (PEA/CTO/Autre) + camembert par secteur.
Librairie pressentie : Recharts (léger, React-natif) ou Chart.js.

---

## Référence UX/UI

**Moning est la référence absolue** pour toutes les décisions de design et de features.
Reproduire fidèlement les features et l'UX de Moning pour investisseur particulier français.

---

## Protocole de validation (alignement Anthropic)

Après chaque US/TASK : appel obligatoire au `test-agent` pour vérifier les critères d'acceptation avant de considérer le ticket terminé.

---

*Mis à jour : clôture Session 11 — 28/03/2026*
