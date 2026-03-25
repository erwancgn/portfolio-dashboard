# SESSION.md — Session 8

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Objectif

| Ticket | Titre | Statut |
|--------|-------|--------|
| #16 US-005 | Rafraîchir les prix automatiquement | 🔴 À faire |
| #17 US-006 | Vue globale du portefeuille (total investi, valeur, P&L) | 🔴 À faire |

---

## Critères d'acceptation

### US-005 — Rafraîchissement auto
- [ ] Les prix se rafraîchissent automatiquement sans action utilisateur
- [ ] Intervalle : toutes les 60 secondes
- [ ] Pas de rechargement complet de page (router.refresh uniquement)
- [ ] Le Server Component `PositionsTable` est préservé (pas transformé en Client Component)
- [ ] Aucune régression sur l'affichage existant des positions

### US-006 — Vue globale
- [ ] Total investi affiché en EUR (Σ quantité × PRU)
- [ ] Valeur actuelle affichée en EUR (Σ quantité × prix_actuel converti EUR)
- [ ] P&L global affiché en € et en %
- [ ] Nombre de positions affiché
- [ ] Composant placé en haut du dashboard, avant le tableau des positions
- [ ] Données cohérentes avec les calculs de `PositionsTable`
- [ ] Aucune régression sur les fonctionnalités existantes

---

## Stack en place

- Auth Supabase ✅ · API `/api/quote` Yahoo Finance ✅ · API `/api/search` ✅
- `AddPositionForm` (ISIN + suggestions) ✅ · `PositionsTable` Server Component ✅
- Conversion devises USD/GBp → EUR (Frankfurter) ✅

## Fichiers clés

```
src/app/dashboard/page.tsx
src/components/positions/PositionsTable.tsx      ← Server Component, requête Supabase directe
src/components/positions/PositionsSectionClient.tsx ← wrapper router.refresh()
src/app/api/quote/route.ts                       ← Yahoo Finance, retourne { price, currency, isin? }
```

---

## Plan technique

**US-005 — Rafraîchissement auto**
Option retenue : polling client — `setInterval` dans un wrapper Client Component → `router.refresh()` toutes les 60s. Preserve le Server Component `PositionsTable`.

**US-006 — Vue globale**
Nouveau Server Component `PortfolioSummary.tsx` en haut du dashboard :
- Total investi = Σ(quantité × PRU)
- Valeur totale = Σ(quantité × prix_actuel_en_EUR)
- P&L global en € et %
- Nombre de positions

Les données sont calculées depuis Supabase + `/api/quote`, même pattern que `PositionsTable`.

---

## Contraintes
- Pas de déploiement Vercel (session suivante)
- Pas de modification schéma DB
- Server Components : toujours requête Supabase directe (jamais `fetch /api/*` interne)
- Crypto : ticker format Yahoo → `BTC-EUR`, `ETH-USD`

---

## Protocole de validation (alignement Anthropic)

Après chaque US : appel obligatoire au `test-agent` pour vérifier les critères d'acceptation ci-dessus avant de considérer le ticket terminé.

---

*Mis à jour : début Session 8 — 25/03/2026*
