# DEVLOG — Portfolio Dashboard IA

## Session 18 — [02/04/2026]

### ✅ Complété : Agents Buffett/Lynch avec données réelles

**Feature #72 + #73 : Analyse classique — données FMP en temps réel**

#### Fichiers créés/modifiés
1. **`src/lib/fmp-financials.ts`** (nouveau)
   - Fetche en parallèle 3 endpoints FMP
   - Formate bloc markdown avec seuils d'interprétation
   - Calcule CAGR EPS/CA (formule exponentielle)
   - Fallback gracieux si FMP indisponible

2. **`src/app/api/analyse/classic/route.ts`**
   - Import `fetchFmpFinancialContext`
   - Injection données via `{financial_data}` dans prompt
   - Gemini reçoit contexte financer complet

3. **`src/agents/buffett-analyse.md`** (réécriture)
   - Interprétations colorées par métrique (ROIC, FCF, MoS)
   - Tableau MoS : BUY(>30%), HOLD(0-30%), SELL(<-10%)
   - DCF simplifié basé sur données réelles

4. **`src/agents/lynch-analyse.md`** (réécriture)
   - PEG seuils : <0.5 exceptionnel à >2 éviter
   - Catégories basées CAGR EPS réel
   - Formule PEG ajusté documentée

#### QA Report
- ✅ Build TypeScript
- ✅ Cache 7 jours + RLS
- ✅ Gestion quota Gemini 429
- ✅ Sécurité (API keys serveur)

#### Non-bloquant (S19)
- `route.ts` 294L, `ClassicAnalysis.tsx` 257L → split en helpers (limite 200L CLAUDE.md)

---

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

## Session 13 — [30/03/2026]

### Contexte
Refonte dashboard, page Analyse, DCA, Quick Analyse IA via Gemini. Clôture tickets #56, #57(partiel), #58, #59, #60.

### Ce qu'on a fait
- [x] **#60 Fix ISIN/Secteur** — Migration `fetchYahooSector()` → `fetchFmpProfile()`. FMP `/stable/profile` retourne logo, secteur, ISIN, industrie, pays. Enrichissement automatique en parallèle des positions sans ISIN/secteur au chargement (`enrichMissingMetadata` dans `positions/route.ts`).
- [x] **#56 Refonte dashboard** — `PortfolioSummary` refondu (hero : valeur totale, P&L €/%, valeur investie, nb positions). `PositionsTableView` refonte complète avec tri par colonne et bouton DCA par ligne.
- [x] **#59 DCA** — Route `POST/GET /api/dca`, migration Supabase `dca_rules` (montant, rythme, enveloppe PEA/CTO/PER, date début). `DcaButton` + `PositionDrawer` (Sheet formulaire depuis le tableau).
- [x] **#58 Quick Analyse (beta)** — Page `/dashboard/analyse` avec `QuickAnalysis` component. Route `POST /api/analyse/ticker` : appel Gemini 2.5 Flash-Lite + Google Search Grounding (données réelles). System prompt 5 sections (Snapshot, Métriques, Forces/Faiblesses, Consensus, Verdict + score /100). Rendu markdown via `react-markdown`. Gestion quota 429 (bandeau ambre).
- [x] **Status line Cursor** — Script `statusline-command.sh` : barre de progression contexte + tokens session + modèle actif.

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| Gemini model `gemini-2.5-flash-lite-preview-06-17` → 404 | ID déprécié | Listé les modèles via API → `gemini-2.5-flash-lite` |
| `googleSearchRetrieval` → 400 | SDK Gemini v0.24 utilise `googleSearch` | Remplacé le nom du tool |
| TS2353 `googleSearch` not in `Tool` type | Typage SDK en retard sur l'API | Cast `as any` avec `eslint-disable` |
| Markdown non rendu | `react-markdown` non installé malgré l'import | `npm install react-markdown` |

### Décisions prises
| Décision | Raison |
|---|---|
| Gemini 2.5 Flash-Lite + Search Grounding au lieu de Claude Haiku | Haiku sans web search hallucine les métriques financières — Gemini grounding = données réelles |
| `GOOGLE_AI_API_KEY` côté serveur uniquement | Sécurité — jamais de clé exposée côté client |
| Réponse Gemini = markdown complet + JSON `{signal, score}` en fin | Signal structuré pour le badge + analyse riche pour l'affichage |
| `matchAll` + dernier match pour extraire le JSON | Le prompt markdown contient des blocs JSON intermédiaires — seul le dernier est le vrai signal |

### Avertissements ouverts
- **#58 rendu UX** : markdown rendu fonctionnel mais style à améliorer (tables, typographie) — à traiter en S14
- **GOOGLE_AI_API_KEY** : à ajouter dans Vercel env vars pour que la prod fonctionne
- **Bug ISIN résiduel** : enrichissement fonctionne au chargement des positions existantes, mais ISIN à l'ajout d'une nouvelle position à re-vérifier

### Prochaine session (S14)
- [ ] UX : améliorer le rendu markdown de QuickAnalysis (tables, typographie, espacement)
- [ ] Vérifier ISIN à l'ajout d'une nouvelle position (bug résiduel S13)
- [ ] #57 : finaliser Page Analyse (chat IA portfolio avec contexte positions)
- [ ] #61 : logo + pays dans le tableau positions

---

*Dernière mise à jour : Session 13 — 30/03/2026*

---

## Session 14 — [30/03/2026]

### Contexte
Polish UI/UX, responsive mobile, version info, setup environnement Claude Code.

### Ce qu'on a fait
- [x] **#62 Setup Claude Code** — `.claude/launch.json` (dev server), hook ESLint `PostToolUse`, `memory: project` + `isolation: worktree` sur dev-agent et test-agent
- [x] **#61 Tableau positions enrichi** — Layout card double-ligne inspiré Moning : logo col gauche (row-span), ligne 1 nom + drapeau pays, ligne 2 métriques (Ticker/Type/Env/Prix/Valeur/P&L/Poids + actions). Nom complet via FMP `companyName`. Pays dans le PositionDrawer.
- [x] **#58 Quick Analyse finalisé** — `remark-gfm` pour le rendu des tables markdown. Bloc JSON `{signal, score}` retiré de l'analyse affichée. Autocomplétion recherche avec dropdown (nom + ticker + type).
- [x] **Responsive mobile** — Cards positions : grille 2×2 métriques essentielles sur mobile, Qty×PRU sur ligne séparée. Header responsive. PortfolioSummary : `text-3xl→5xl`, stats en `grid-cols-2` mobile. LiquidityWidget : grille 3 colonnes équilibrée.
- [x] **VersionBadge** — Badge `v0.3.0` dans le header, modale historique des versions en langage fonctionnel (`src/lib/version.ts`).
- [x] **AnalyseSection déplacée** — Poids/Secteur/Pays retiré du dashboard → page Analyse uniquement.

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `--color-bg-card` transparent | Variable CSS inexistante dans globals.css | Remplacé par `--color-bg-primary` (#ffffff) |
| Noms actifs affichent le ticker | `name` null en DB pour positions créées avant tracking | Ajout `!p.name` dans le filtre `enrichPositions` + mapping `companyName` dans `fetchFmpProfile` |
| Tables markdown affichées en texte brut | `remark-gfm` absent | `npm install remark-gfm` + plugin ajouté à ReactMarkdown |

### Décisions prises
| Décision | Raison |
|---|---|
| Gemini 2.5 Flash pour chat portfolio (S15) | Free tier 1500 req/jour, déjà intégré, meilleur que Flash-Lite |
| Groq Llama 3.3 70B en fallback (futur) | Free tier très généreux si quota Gemini dépassé |
| Perplexity écarté | API payante, pas de free tier |
| Logos absents dans suggestions recherche | 8 appels FMP par frappe = trop gourmand. Affichage nom+ticker+type suffit |

### Prochaine session (S15)
- [ ] **#57 EPIC 15** — Chat IA portfolio : conversation avec Gemini 2.5 Flash sur l'ensemble du portefeuille (positions, P&L, allocation, recommandations)
- [ ] **Couleurs allocation** — Palette donut chart plus visuelle
- [ ] **Push prod** — `git push` → déploiement Vercel

---

*Dernière mise à jour : Session 14 — 30/03/2026*

---

## Session 15 — [31/03/2026]

### Contexte
Fix HTTP 500 sur le Chat IA portfolio (#57) + validation prod.

### Ce qu'on a fait
- [x] **#57 Fix CONFIG_ERROR** — Route `/api/analyse/chat` utilisait `process.env.GEMINI_API_KEY` (inexistante). Corrigé en `GOOGLE_AI_API_KEY` (cohérent avec `/api/analyse/ticker`). 1 ligne de fix, 0 régression.
- [x] **Chat IA portfolio validé** — Gemini 2.5 Flash répond avec contexte portfolio complet, historique de conversation fonctionnel (mémoire multi-tours).

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| HTTP 500 `CONFIG_ERROR` sur `/api/analyse/chat` | Variable d'env `GEMINI_API_KEY` inexistante — la clé réelle est `GOOGLE_AI_API_KEY` | Renommage ligne 165 de la route |

### Décisions prises
| Décision | Raison |
|---|---|
| Pas de renommage de variable globale | Une seule route concernée — fix minimal, pas de refacto |

### Prochaine session (S16)
- [ ] **Couleurs allocation** — Palette donut chart plus visuelle
- [ ] **Push prod** — `git push` → déploiement Vercel

---

## Session 17 — [01/04/2026]

### Contexte
Implémentation du ticket #70 : graphique de performance portfolio avec heatmap Wall Street.

### Ce qu'on a fait
- [x] **#70 PerformanceSection** — Server Component : fetch quotes live, calcul valeur totale, upsert snapshot quotidien (`portfolio_snapshots`), données heatmap
- [x] **#70 PerformanceChart** — Client Component : tab "Performance" (LineChart + sélecteur périodes YTD/1M/3M/6M/1A/Max) + tab "Carte" (Treemap heatmap Wall Street)
- [x] **#70 PerformanceTile** — Renderer SVG custom Treemap : couleurs rouge→vert selon variation 24h, labels ticker + %
- [x] **#70 fetchQuote enrichi** — `changePercent` calculé via `(price - chartPreviousClose) / chartPreviousClose × 100` (Yahoo ne retourne pas `regularMarketChangePercent` sur `/v8/chart`)
- [x] **#70 AllocationSection remplacée** sur `/dashboard` par `PerformanceSection` (reste intact sur `/dashboard/analyse`)
- [x] **#70 Heatmap lisible** — `Math.sqrt(value)` comme taille Treemap pour éviter que Bitcoin écrase toutes les autres tuiles

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| Heatmap toutes grises (changePercent = 0) | Yahoo `/v8/finance/chart` ne retourne pas `regularMarketChangePercent` ni `regularMarketPreviousClose` — uniquement `chartPreviousClose` | Calcul manuel `(price - chartPreviousClose) / chartPreviousClose × 100` |
| Positions manquantes dans heatmap | Bitcoin dominant → autres tuiles < 20px → `PerformanceTile` retournait `null` | `Math.sqrt(value)` comme taille + seuil rendu abaissé à 10px |

### Décisions prises
| Décision | Raison |
|---|---|
| `Math.sqrt(value)` pour tailles Treemap | Compresse les gros actifs (BTC) sans masquer les petites positions — ratio lisible |
| Snapshot upsert à chaque chargement | Idempotent via `onConflict: 'user_id,date'` — accumulation automatique sans cron |

### Prochaine session (S17 suite)
- [ ] **#71** — Calendrier des dividendes
- [ ] **#74** — Fair Value — valeur intrinsèque estimée

---

*Dernière mise à jour : Session 15 — 31/03/2026*

---

## Session 16 — [31/03/2026]

### Contexte
Session courte de planification : analyse comparative Moning + Trade Republic, création du backlog S17, merge Dependabot PRs.

### Ce qu'on a fait
- [x] **Analyse Moning + Trade Republic** — Identification des features must-have : graphique performance, calendrier dividendes, rapport fiscal, fair value, scores Buffett/Lynch
- [x] **Backlog S17** — 6 tickets créés sur GitHub (#70 → #75) avec critères d'acceptation et stack technique
- [x] **Dependabot** — Merge PRs #64 (react-dom), #65 (TypeScript 6.0), #67 (tailwind/postcss), #68 (@types/node 20→25). PR #66 (eslint-config-next) fermée par conflit → sera recréée automatiquement

### Décisions prises
| Décision | Raison |
|---|---|
| Graphique performance en P1 | Feature centrale attendue par tout investisseur — impact visuel maximal |
| Rapport fiscal en P1 | Valeur réelle pour déclaration 2026 — données déjà disponibles dans `transactions` |
| Scores Buffett/Lynch en P2 | Différenciants mais pas bloquants — dépendent de Gemini Search Grounding |
| TypeScript 6.0 mergé | `npm run build` local → 0 erreurs, safe to merge |

### Prochaine session (S17)
- [ ] **#70** — Graphique performance portfolio (courbe valeur dans le temps)
- [ ] **#75** — Rapport fiscal annuel
- [ ] **#71** — Calendrier des dividendes

---

---

## Session 17 — 01/04/2026

### PortfolioSummary unifié (amélioration UI)
- **Problème** : deux cards séparées (`PortfolioSummary` + `PnlStats`) faisaient les mêmes appels API (fetchQuote × 2) et laissaient un grand espace vide à droite sur desktop.
- **Solution** : fusion de la logique `PnlStats` dans `PortfolioSummary` (réutilisation des quotes déjà fetchées), suppression du fichier `PnlStats.tsx`, layout `grid grid-cols-2 sm:grid-cols-4` pour remplir toute la largeur.
- **Résultat** : 1 seule card, 0 doublon API, responsive 2→4 colonnes.

### Positions — hover reveal + FairValueCell tooltip (S17 suite)
- **Hover reveal** : boutons + Achat / Vendre / DCA / Fair value révélés au survol desktop (`group-hover:flex`), permanents mobile. Testé navigateur ✓
- **FairValueCell tooltip** : `--color-bg-card` n'existait pas → background transparent/invisible. Fix : remplacement par `--color-bg-elevated` (`#f1f5f9`). Largeur `w-72`, hauteur adaptative au volume de texte.

### Fix déploiements Vercel — hotfix (01/04/2026)
- **Symptôme** : tous les déploiements Vercel en erreur depuis ~16h, échec en 4–6s sans logs de build.
- **Cause 1** : Dependabot avait bumped `react-dom@19.2.4` sans bumper `react` (resté à `19.2.3`). `react-dom@19.2.4` exige `react@^19.2.4` → conflit peer deps → `npm install` échoue sur Vercel (fresh install strict). Localement invisible car `node_modules` était en cache à l'ancienne version.
- **Cause 2** : Dependabot avait bumped TypeScript `5.9.3 → 6.0.2`. TypeScript 6 exige des déclarations de type pour les side-effect imports CSS (`import './globals.css'`). Build local passait (cache), Vercel échouait avec `Cannot find module or type declarations for side-effect import of './globals.css'`.
- **Fix 1** : `package.json` — `react` aligné sur `"19.2.4"` (cohérent avec react-dom)
- **Fix 2** : `tsconfig.json` — ajout `"allowArbitraryExtensions": true`
- **Fix 3** : `src/app/globals.css.d.ts` — déclaration TypeScript pour le CSS side-effect import
- **Résultat** : `npm run build` ✓ + `vercel build --prod` ✓

### Tickets #72 et #73 — Analyse Buffett + Lynch (01/04/2026)
- **Route** : `POST /api/analyse/classic` — charge le prompt agent en system instruction Gemini 2.5 Flash, extrait le JSON final, upsert dans `classic_analysis_cache` (cache 7j, RLS user_id).
- **Migration** : `20260402000000_add_classic_analysis_cache.sql` — table + check method/signal + unique(user_id, ticker, method).
- **Composant** `ClassicAnalysis.tsx` : sélecteur Buffett/Lynch, autocomplete, badges moat/marge sécurité (Buffett) + catégorie/PEG/story (Lynch), rendu markdown complet.
- **Onglet** "Buffett / Lynch" ajouté dans `AssetAnalysisTabs`.
- **Piège** : `db reset` a déclenché un push vers la base remote (prod) au lieu du local — les 3 migrations en attente ont été poussées en prod (tables nouvelles, non destructif). À éviter : toujours utiliser `--local` pour les opérations locales.

### Seed données de test (01/04/2026)
- `supabase/seed.sql` créé : user `test@test.com` / `test1234` + 7 positions (MSFT, ESEE.MI, NBIS, NVDA, DG.PA, IE000I8KRLL9.SG, ESE.PA).
- Hash bcrypt généré via `crypt()` PostgreSQL local — idempotent (`ON CONFLICT DO NOTHING`).

### Fair value — popup "?" (01/04/2026)
- Explication masquée par défaut dans `FairValueCell.tsx` (vue positions) et `FairValue.tsx` (page Analyse).
- Remplacement du tooltip hover par un bouton "?" → popup modale (overlay `bg-black/50`, carte centrée, fermeture par ✕ ou clic backdrop).
- **Fix couleurs** : variables CSS `--color-bg-card`/`--color-border` illisibles en light mode → couleurs hardcodées `gray-*` pour garantir le contraste.

### Prochaine session (S18)
- **#71** Calendrier des dividendes (P1)
- **#74** Fair Value (P1) — améliorer / compléter la page dédiée
- **#75** Rapport fiscal — imposition et déclaration annuelle (P3)

*Dernière mise à jour : Session 17 — 01/04/2026*
