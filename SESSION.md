# SESSION.md — Session 11

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Objectif

| Ticket | Titre | Statut |
|--------|-------|--------|
| #47 TASK | Table transactions (historique achats/ventes) | 🔴 À faire |
| #50 EPIC 13 | Refonte UI/UX — Moning + Trade Republic | 🔴 À faire |
| #51 TASK | Setup shadcn/ui | 🔴 À faire |

---

## Critères d'acceptation

### #47 — Table transactions
- [ ] Migration SQL créée et appliquée en local
- [ ] Table `transactions` avec colonnes : id, user_id, position_id, ticker, type, quantity, price, total, executed_at
- [ ] PATCH /api/positions/[id] insère une transaction à chaque achat DCA
- [ ] RLS activé sur la table

### #51 — Setup shadcn/ui
- [ ] shadcn/ui initialisé dans le projet
- [ ] Composants Dialog, Sheet, Table disponibles dans `src/components/ui/`
- [ ] Aucune régression sur l'existant

---

## Stack en place

- Auth Supabase ✅ · API `/api/quote` Yahoo Finance ✅ · API `/api/search` ✅
- `AddPositionForm` (ISIN + suggestions) ✅ · `PositionsTable` Server Component ✅
- `PortfolioSummary` (total investi, valeur, P&L) ✅ · `DeletePositionButton` ✅
- Polling auto 60s (`PositionsSectionClient`) ✅
- `src/lib/quote.ts` (fetchQuote + fetchRate avec `cache()`) ✅ · `src/lib/format.ts` ✅
- Production : https://portfolio-zeta-fawn-73.vercel.app ✅

## Fichiers clés

```
src/app/dashboard/page.tsx
src/app/api/quote/route.ts                        ← à enrichir (secteur via quoteSummary)
src/app/api/positions/[id]/route.ts               ← à enrichir (PATCH pour achat)
src/components/positions/PositionsTable.tsx       ← Server Component
src/components/positions/AddPositionForm.tsx      ← à enrichir (secteur + lookup ticker)
src/components/portfolio/PortfolioSummary.tsx     ← StatCards US-010 à ajouter ici ou composant séparé
src/lib/quote.ts                                  ← fetchQuote + fetchRate (React cache())
src/lib/format.ts                                 ← formatEur + formatPct
```

---

## Plan technique

**US-003 — Achat sur position existante**
`PATCH /api/positions/[id]` → recalcul PRU + quantité côté serveur.
`AddBuyButton.tsx` Client Component sur chaque ligne → mini-form (qty + prix) → PATCH → router.refresh().

**US-010 — P&L détaillé**
4 StatCards dans `PortfolioSummary` ou composant `PnlStats.tsx` dédié.
Tri par P&L dans `PositionsTable` (remplace tri par valeur).

**TECH — ISIN/Ticker/Nom/Secteur**
`/api/quote` : appel Yahoo `quoteSummary` pour secteur.
`AddPositionForm` : au blur du champ Ticker → fetch `/api/quote` → remplir ISIN + secteur.
`PositionsTable` : colonne Secteur. Secteur stocké dans `positions.sector`.

---

## Contraintes
- Server Components : toujours requête Supabase directe
- Recalcul PRU côté serveur uniquement (jamais côté client)
- Secteur : optionnel, ne pas bloquer l'ajout si Yahoo ne le retourne pas

---

## Protocole de validation (alignement Anthropic)

Après chaque US/TASK : appel obligatoire au `test-agent` pour vérifier les critères d'acceptation avant de considérer le ticket terminé.

---

*Mis à jour : clôture Session 10 — 25/03/2026*
