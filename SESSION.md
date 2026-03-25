# SESSION.md — Session 10

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Objectif

| Ticket | Titre | Statut |
|--------|-------|--------|
| #14 US-003 | Ajouter un achat sur position existante (recalcul PRU) | 🔴 À faire |
| #21 US-010 | P&L détaillé (StatCards + tri) | 🔴 À faire |
| TECH | ISIN/Ticker/Nom/Secteur interconnectés | 🔴 À faire |

---

## Critères d'acceptation

### US-003 — Ajouter un achat sur position existante
- [ ] Bouton « + Achat » visible sur chaque ligne du tableau
- [ ] Mini-formulaire : quantité achetée + prix d'achat
- [ ] PRU recalculé : (old_qty × old_pru + new_qty × prix_achat) / (old_qty + new_qty)
- [ ] Quantité mise à jour : old_qty + new_qty
- [ ] Aucun doublon créé en base
- [ ] Dashboard rafraîchi après validation

### US-010 — P&L détaillé
- [ ] 4 StatCards : meilleure position, pire position, nb positions en gain, nb en perte
- [ ] Tableau trié par P&L décroissant (pas par valeur)
- [ ] Couleurs vert/rouge cohérentes

### TECH — ISIN/Ticker/Nom/Secteur
- [ ] `/api/quote` retourne le secteur (Yahoo Finance quoteSummary)
- [ ] Ticker saisi manuellement → lookup ISIN + secteur au blur
- [ ] Secteur stocké en base à l'ajout d'une position
- [ ] Colonne Secteur visible dans PositionsTable

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

*Mis à jour : début Session 10 — 25/03/2026*
