# DEVLOG — Portfolio Dashboard IA


### Règles de travail (à appliquer à chaque session)
1. `git pull` pour récupérer les dernières modifications
2. `supabase start` pour lancer l'environnement local
3. `nvm use 20` pour s'assurer de la bonne version Node
4. Lire le DEVLOG — section "Prochaine session"
5. Passer les tickets de la session en "In Progress" sur le board GitHub
6. En fin de session : mettre à jour le DEVLOG + fermer/déplacer les tickets
> Ce fichier est le garde-fou contre les erreurs répétées et la perte de contexte IA.

---

## Sessions S1 → S10 — Archivées

> Historique complet dans `DEVLOG_ARCHIVE.md`

---

## Session 11 — [28/03/2026]

### Contexte
#51 Setup shadcn/ui (implémenté depuis mobile via code.claude.com) + #47 Table transactions + début TECH ISIN/Secteur.

### Ce qu'on a fait
- [x] **#51 shadcn/ui** — `components.json` + composants `Dialog`, `Sheet`, `Table` dans `src/components/ui/` + `src/lib/utils.ts` (`cn()`). Implémenté depuis téléphone, mergé depuis `claude/start-session-38rkh`.
- [x] **#47 Table transactions** — migration SQL `20260328000000_create_transactions.sql` (table + RLS + 2 policies). `PATCH /api/positions/[id]` insère une transaction `buy` après chaque achat DCA (non-bloquant). Type `transactions` ajouté dans `database.ts`. Migration appliquée en local.

### Décisions prises
| Décision | Raison |
|---|---|
| `position_id` nullable dans transactions | Prépare les imports futurs (Trade Republic) sans position correspondante |
| INSERT transaction non-bloquant | Un bug d'historique ne doit pas bloquer l'achat DCA — arbitrage MVP validé par PO |

### Avertissement ouvert
- INSERT transaction non-atomique avec UPDATE position — historique peut être silencieusement incomplet si l'INSERT échoue. À migrer vers une RPC Supabase (BEGIN/COMMIT) si problèmes constatés en prod.

- [x] **#50 Refonte UI/UX** — thème light (blanc/noir/bleu), hero valeur totale, PnlStats compact, tableau 5 colonnes + drawer Sheet, AddPositionForm en Dialog modale, polling conservé
- [x] **#55 Liquidités + Fiscalité** — table `liquidities` + RPCs atomiques `buy_position`/`sell_position`/`deposit_liquidity`, flat tax 30% CTO/Crypto (0% PEA), `SellButton` avec prévisualisation P&L+taxe+net, `LiquidityWidget`, `DepositButton`, colonne Taxe dans Historique, `database.ts` regénéré avec types RPC

### Décisions prises (suite S11)
| Décision | Raison |
|---|---|
| Thème light (fond blanc) | Demande explicite PO — mix Trade Republic + Moning |
| Moning comme référence UX/UI | PO considère Moning parfait pour l'investisseur particulier français |
| RPCs buy/sell/deposit atomiques avec liquidités | Cohérence comptable — chaque opération impacte les liquidités en même temps que la position |
| Flat tax 30% appliquée immédiatement en CTO/Crypto | Comportement fiscal français — fait générateur à la vente |
| PEA : 0% taxe, argent reste dans enveloppe | Régime fiscal PEA — exonération IR tant que dans l'enveloppe |
| Exception 200 lignes pour `database.ts` | Fichier généré automatiquement par `supabase gen types` |

### Prochaine session (S12)
- [ ] TECH ISIN/Secteur — fiabiliser Yahoo Finance (secteur + ISIN souvent `—`)
- [ ] Graphique allocation (camembert enveloppe/secteur) — feature Moning
- [ ] Migrations à appliquer en prod après `git push`

---

## Session 12 — [28/03/2026]

### Contexte
Enrichissement ISIN/secteur Yahoo Finance + graphiques d'allocation (donut Recharts) + vues Poids/Secteur/Pays avec prix live + polish UI complet + agents et skills.

### Ce qu'on a fait
- [x] **TECH ISIN/Secteur** — `src/lib/yahoo.ts` extrait de `/api/quote` : `fetchYahooChart` (prix + ISIN via `/v8/finance/chart`) + `fetchYahooSector` (secteur action via `summaryProfile`, secteur ETF dominant via `topHoldings.sectorWeightings`). Architecture en cascade : DB cache d'abord → Yahoo chart → Yahoo quoteSummary → saisie manuelle.
- [x] **#52/#53 Graphique allocation** — `AllocationSection` (Server Component, agrège par enveloppe + secteur avec prix live) + `AllocationChart` (Client Component, donut Recharts avec onglets Enveloppe/Secteur, légende + pourcentages). Intégré dans le dashboard.
- [x] **#18 Vue Poids** — `AnalyseSection` (Server Component, prix live via `fetchQuote` + `cache()` React 19) + `AnalyseChart` (Client Component, onglets Poids/Secteur/Pays, barres de progression, tri décroissant, valeur € + %).
- [x] **#20 Vue Secteur** — agrégation par secteur dans `AnalyseSection`, fallback "Non classé" si secteur null.
- [x] **Vue Pays** — `getCountry()` dérive le pays du suffix ticker (.PA→France, .MI→Italie, .L→Royaume-Uni, etc.), crypto détectée par tiret.
- [x] **Polish UI complet** — tokens CSS cohérents (`--color-*`), `tabular-nums` sur les chiffres, hiérarchie visuelle (titres, sous-titres, conteneurs), refacto globale des composants portfolio.
- [x] **Extraction `src/lib/yahoo.ts`** — module dédié Yahoo Finance avec types (`YahooChartMeta`, `YahooApiError`), mapping `SECTOR_LABELS` pour ETF, headers standardisés.
- [x] **Agents & Skills** — `ux-agent` créé (designer fintech senior, références Trade Republic + Moning), skill `design-review` + skill `finance-formulas`.

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `fetchYahooSector()` retourne `undefined` systématiquement | Yahoo exige un crumb (cookie `fc.yahoo.com` + token CSRF) pour `/quoteSummary` — 401/404 sans crumb | Bug identifié, fix reporté en S13 (crumb + cookies) |
| Violation `style={{}}` dans `AnalyseChart.tsx` (barre de progression `width: X%`) | Valeur calculée dynamiquement à l'exécution | Toléré — CLAUDE.md mis à jour avec exception pour valeurs CSS dynamiques |
| QA tickets #18/#20 FAIL partiel | Vues Barres et Camembert non implémentées (seule vue Liste), P&L par secteur absent (#20 CA3) | Accepté comme livraison partielle — vues supplémentaires reportées |

### Décisions prises
| Décision | Raison |
|---|---|
| Architecture en cascade ISIN/Secteur (DB → Yahoo chart → quoteSummary → saisie manuelle) | Minimise les appels réseau, DB comme cache, toujours un fallback |
| Fichiers composants en PascalCase (pas kebab-case) | Convention établie dans tout le projet — CLAUDE.md mis à jour |
| `style={{}}` toléré pour valeurs CSS dynamiques | Pattern récurrent (barres de progression), impossible en Tailwind statique |
| Prix live dans AnalyseSection via `fetchQuote` + `cache()` | Les vues Poids/Pays doivent refléter la valeur actuelle, pas la valeur investie |
| OpenFIGI écarté pour enrichissement ISIN | Ne retourne pas les ISIN directement — pas de valeur ajoutée |

### Avertissements ouverts
- **QA FAIL partiel #18/#20** : seule la vue Liste est implémentée (pas Barres ni Camembert). P&L par secteur absent. Tickets à requalifier ou critères à adapter en S13.
- **Bug Yahoo crumb** : `fetchYahooSector()` ne fonctionne plus en production — secteur vide à l'ajout de position. Fix prioritaire S13.

### Prochaine session (S13)
- [ ] FIX : Bug Yahoo crumb — implémenter fetch cookies + crumb pour `fetchYahooSector()`
- [ ] #56 : EPIC 14 — Refonte dashboard (bandeau récap + tableau tri/DCA)
- [ ] #57 : EPIC 15 — Page Analyse + chat IA Claude API
- [ ] #58 : EPIC 16 — Page Analyse Titre (quick/standard/full)
- [ ] #59 : FEAT — DCA depuis tableau principal

---

*Dernière mise à jour : Session 12 — 28/03/2026*
