# SESSION.md — Suivi sessions actives

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Session 24 — Fait (02/04/2026)

**Hotfix : quota FMP dépassé en prod (282/250 calls/jour)**

**Root cause**
- `GET /api/positions` appelait FMP à chaque page load pour les positions sans ISIN/secteur
- `PositionsTable.tsx` faisait la même chose en doublon au rendu
- `POST /api/positions` n'appelait pas FMP → données statiques jamais sauvées → boucle infinie

**Livré**
- `POST /api/positions` : 1 appel FMP unique à la création si isin ou sector manquants
- `GET /api/positions` : suppression de `enrichMissingMetadata` — retour DB direct, zéro FMP
- `PositionsTable.tsx` : suppression de `enrichPositions` + import FMP
- `scripts/enrich-positions.ts` : script one-shot (positions prod déjà toutes enrichies)

**Règle établie** : données statiques (ISIN, secteur, pays, logo) → 1 fetch FMP à la création, stocké en DB, jamais re-fetché. Prix live → Yahoo uniquement.

**Commits :** `a46b6ec`, `e5ac4a4`

---

## Session 23 — Fait (faf299f)

**Livré**
- #71 Calendrier des dividendes — page `/dashboard/dividendes`, projection 12 mois, yield on cost, devise native
- #75 Rapport fiscal — route `GET /api/fiscal`, page `/dashboard/fiscal`, export CSV/PDF, flat tax 30% CTO
- Import PDF Trade Republic + parsing IFU 2025
- Persistance des métadonnées fiscales dans `transactions` via RPCs Supabase
- Bootstrap démo local après `supabase db reset`

---

## Stack en place

- Auth Supabase ✅ · FMP API ✅ (quote, key-metrics, income-statement, profile)
- Gemini 2.5 Flash ✅ · Agents Buffett/Lynch ✅
- `AllocationChart` (Recharts donut) ✅ · `PortfolioSummary` hero ✅
- Transactions atomiques (RPCs PostgreSQL) ✅ · Historique transactions ✅
- Fiscalité flat tax 30% CTO/Crypto, 0% PEA ✅ · Thème light ✅
- DCA : table + route + UI ✅ · Responsive mobile ✅
- Production : https://portfolio-zeta-fawn-73.vercel.app ✅

---

## Fichiers clés

```
src/app/api/positions/route.ts                 ← CRUD positions (FMP à la création uniquement)
src/components/positions/PositionsTable.tsx    ← Tableau positions (zéro FMP)
src/app/api/analyse/classic/route.ts           ← Buffett/Lynch avec FMP
src/app/api/dividends/route.ts                 ← Dividendes FMP
src/app/api/fiscal/route.ts                    ← Rapport fiscal
src/lib/fmp.ts                                 ← fetchFmpProfile
src/lib/fmp-financials.ts                      ← quote/metrics/income FMP
src/types/database.ts                          ← Types générés Supabase
```

---

## Session 25 — Fait (03/04/2026)

**Nettoyage + review backlog**

- Worktrees orphelins nettoyés (6 worktrees + branches supprimés)
- GH-75 clôturé (rapport fiscal 100% implémenté, tous CAs couverts)
- Split `ClassicAnalysis.tsx` 247L → `ClassicAnalysis.tsx` 142L + `ClassicResultCard.tsx` 120L
- Review SM backlog complet : aucune autre story à clôturer

---

## Session 26 — Fait (04/04/2026)

**GH-38 — Corbeille & suppression douce (commit 02eda7f)**

- Migration DB : colonne `deleted_at`, index partiels, 5 policies RLS granulaires
- `DELETE /api/positions/[id]` → soft delete (`deleted_at = now()`)
- `GET /api/positions` + page dashboard → filtre `deleted_at IS NULL`
- `GET /api/positions/trash` → liste corbeille
- `POST /api/positions/[id]/restore` → restauration
- `DELETE /api/positions/trash` → purge définitive
- `TrashDrawer.tsx` → vue corbeille, restauration individuelle, confirmation purge
- Bouton "Supprimer" sur chaque carte (desktop hover + mobile)
- Bouton corbeille 🗑 dans `PositionsSectionClient`

---

## Session 27 — Fait (04/04/2026)

**Optimisation architecture IA — routing agents + sizing tickets**

- Analyse critique du plan ChatGPT "Builder/Planner/Reviewer" → appliqué à la couche dev
- Routing agents inversé : fast-track (ticket existant) = défaut, BMAD = exception pour nouveaux besoins vagues
- Table de routage explicite ajoutée en tête de `agent-protocol.md`
- Définition T-shirt sizing (XS/S/M/L/XL) avec règle de routage par taille
- `## Estimation` ajouté dans `templates/story.md` et `checklists/story-draft.md` → obligatoire à la création
- SM appelé uniquement en BMAD (nouveau besoin) — jamais sur ticket existant
- EPIC GH-89 créé + 6 stories (GH-90→95) : améliorations IA prod + dev workflow
  - GH-90 AIService unifié · GH-91 Structured output · GH-92 Cache FMP
  - GH-93 Quota serveur · GH-94 Haiku tier · GH-95 Fast-track tickets

**Fichiers modifiés**
- `.claude/rules/agent-protocol.md` — routing + T-shirt sizing
- `.claude/workflows/brownfield-fullstack.md` — fast-track = défaut
- `.claude/templates/story.md` — ajout ## Estimation
- `.claude/checklists/story-draft.md` — vérification taille obligatoire
- `.claude/backlog/Epic/GH-89.md` + Stories GH-90→95

---

## Sprint — Prochaine session (2 options)

### Option A — Coût prod IA (EPIC GH-89)
| # | Ticket | Impact | Effort |
|---|--------|--------|--------|
| 1 | **GH-90** AIService unifié | Code DRY, fiabilité, circuit-breaker | M |
| 2 | **GH-91** Structured output Gemini | Zéro regex fragile | M |
| 3 | **GH-92** Cache FMP 24h | −500ms / requête analyse | M |

### Option B — UX/UI fluidité (EPIC GH-88) 🔴 Urgent
| # | Ticket | Impact | Effort |
|---|--------|--------|--------|
| 1 | **GH-82** Supprimer bouton retour | Nav fluide | XS |
| 2 | **GH-83** Donut chart | Visual polish | S |
| 3 | **GH-84** Chat UX | Confort quotidien | S |
| 4 | **GH-85** Autocomplete | Saisie ticker | S |
| 5 | **GH-86** Auto-fill | Formulaire position | S |
| 6 | **GH-87** Changelog | Info utilisateur | XS |

### Backlog restant
| Ticket | Statut | Bloqué par |
|--------|--------|-----------|
| GH-22 DCA règles | Partiel | — |
| GH-54 Export CSV | À faire | — |
| GH-23 DCA passage | À faire | GH-22 |
| GH-24 DCA historique | À faire | GH-23 |
