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

## Session 1 — [16/03/2026]

### Ce qu'on a fait
- [x] Brainstorming produit complet
- [x] Cahier des charges rédigé
- [x] Backlog modélisé (EPIC / US / TASK)
- [x] Installation nvm + Node.js v20 LTS
- [x] Installation Homebrew + GitHub CLI
- [x] Initialisation Git + GitHub
- [x] Création des 4 fichiers de documentation
- [x] Projet Next.js créé et fonctionnel sur localhost:3000
- [x] 38 tickets créés automatiquement via script
- [x] Board Kanban configuré avec automatisations
- [x] TASK-001 à TASK-004 fermées et en Done

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `Failed to clone nvm` | Licence Xcode non acceptée | `sudo xcodebuild -license` |
| Commit fichiers vides | `git add` avant `Cmd+S` | Toujours `Cmd+S` → `git add` → `git commit` |
| `remote origin already exists` | Mauvaise URL copiée | `git remote remove origin` puis bonne URL |
| `node_modules` corrompus | Copie manuelle via `cp -r` | `rm -rf node_modules && npm install` |
| `gh issue close` multi-args | Syntaxe incorrecte | Fermer une issue à la fois | Vulnérabilité modérée npm | Dépendance Next.js signalée | Ne pas lancer --force, surveiller les updates officielles Next.js 14 | | `uuid_generate_v4() does not exist` | PostgreSQL moderne utilise gen_random_uuid() nativement | Remplacer uuid_generate_v4() par gen_random_uuid() partout, supprimer l'extension uuid-ossp |npm audit moderate | CWE-352/444/400/770 dans Next.js 14 | CVSS score 0, risque théorique, usage personnel. Surveiller Next.js 14.x patch releases. Ne pas upgrader en force vers Next.js 16. |

### Décisions prises
| Décision | Raison |
|---|---|
| nvm pour Node.js | Gérer v12 existante + v20 |
| Documentation avant le code | Garde-fou IA + maintenabilité |
| GitHub Projects + automatisations | Pilotage projet visible en entretien |

### Prochaine session
- [ ] Installer Docker Desktop
- [ ] Installer Supabase CLI
- [ ] Créer projet Supabase prod sur supabase.com
- [ ] TASK-005 : Configurer Supabase

---

## Session 2 — [17/03/2026]

### Contexte
Installation de l'environnement base de données local.
Objectif : TASK-005 Configurer Supabase.

### Ce qu'on a fait
- [x] Mise à jour Command Line Tools Xcode
- [x] Docker Desktop v29.2.1 installé et lancé
- [x] Supabase CLI v2.78 installé via Homebrew
- [x] Supabase initialisé dans le projet (`supabase init`)
- [x] Projet Supabase lié (`supabase link`)
- [x] `.env.local.example` créé
- [x] `.env.local` rempli avec les clés locales Supabase
- [x] Migration SQL initiale créée (6 tables)
- [x] Migration appliquée via `supabase db reset`
- [x] 6 tables vérifiées dans Supabase Studio
- [x] TASK-005 fermée sur GitHub

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| Command Line Tools obsolètes | Xcode CLT pas à jour | Software Update Mac |
| `uuid_generate_v4() does not exist` | PostgreSQL moderne n'utilise plus cette fonction | Remplacer par `gen_random_uuid()` partout |
| Tables absentes après `db push` | Migration enregistrée mais pas exécutée correctement | `supabase db reset` pour tout réappliquer |
| npm audit moderate | CWE-352/444/400/770 dans Next.js 14 | CVSS score 0, risque théorique — surveiller Next.js 14.x patches |

### Décisions prises
| Décision | Raison |
|---|---|
| `gen_random_uuid()` à la place de `uuid_generate_v4()` | Fonction native PostgreSQL moderne, pas besoin d'extension |

### Rétro session 2

#### Tickets fermés par erreur
Les automatisations GitHub ont fermé tous les tickets lors de l'import dans le board.
Script `scripts/reopen-issues.sh` créé pour rouvrir les 21 tickets concernés.

#### Nouveaux tickets créés suite à la rétro
| Ticket | Priorité | Raison |
|---|---|---|
| [TASK] Clients Supabase browser + server | P0 | Bloque toute l'auth et les données |
| [TASK] Générer types TypeScript Supabase | P0 | TypeScript doit connaître le schéma DB |
| [TASK] Configurer Supabase production | P1 | Nécessaire avant déploiement Vercel |

#### Ce qui manquait dans le backlog initial
- Les clients Supabase n'étaient pas des tickets explicites
- La génération des types TypeScript n'était pas prévue
- La config prod Supabase était implicite dans TASK-008 Déploiement Vercel

#### Décisions de priorisation
- Clients Supabase et types TypeScript en P0 car ils bloquent TASK-006 Auth
- Config prod en P1 car on travaille en local pour l'instant

### Prochaine session
- [ ] Commiter scripts/reopen-issues.sh
- [ ] Créer src/lib/supabase/client.ts
- [ ] Créer src/lib/supabase/server.ts
- [ ] Générer les types TypeScript : `supabase gen types typescript --local > src/types/database.ts`
- [ ] TASK-006 : Configurer l'authentification 

---

---

## Session 3 — [18/03/2026]

### Contexte
Configuration de l'authentification et des clients Supabase.
Objectifs : clients Supabase, types TypeScript, page de login, proxy auth.

### Ce qu'on a fait
- [x] Clients Supabase créés (browser `client.ts` + server `server.ts`)
- [x] Package `@supabase/ssr` installé
- [x] Types TypeScript générés depuis le schéma DB (`src/types/database.ts`)
- [x] Thème Tailwind v4 configuré dans `globals.css`
- [x] Proxy d'authentification créé (`src/proxy.ts`)
- [x] Page de login créée avec Tailwind v4 (`/auth/login`)
- [x] Alias `@/*` corrigé dans `tsconfig.json` (`./src/*` au lieu de `./`)
- [x] Suppression dossier `app/` racine (conflit avec `src/app/`)
- [x] Suppression `src/app/test/` (dossier de debug temporaire)
- [x] Migration `middleware.ts` → `proxy.ts` (Next.js 16)
- [x] README.md mis à jour avec notre stack réelle
- [x] Page de login fonctionnelle sur `localhost:3000/auth/login`

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `clients.ts` au lieu de `client.ts` | Typo à la création du fichier | `mv src/lib/supabase/clients.ts src/lib/supabase/client.ts` |
| `Cannot find module @/lib/supabase/client` | Alias `@/*` pointait vers `./` au lieu de `./src/` | Corriger `tsconfig.json` paths |
| `SyntaxError: Unexpected token '?'` | Node.js v12 actif au lieu de v20 | `nvm use 20` dans terminal Cursor |
| Next.js 16 installé au lieu de 14 | Copie depuis `portfolio-temp` | Décision : rester sur Next.js 16 + React 19 |
| Impossible de downgrader Next.js 14 | React 19 incompatible avec Next.js 14 (requiert React 18) | Rester sur Next.js 16 + React 19 — stack actuelle stable |
| `@theme` warning dans `globals.css` | Cursor ne reconnaît pas encore Tailwind v4 | Ignoré — fonctionne à l'exécution |
| 404 persistant sur `/auth/login` | `layout.tsx`, `page.tsx`, `globals.css` non sauvegardés sur disque | `Cmd+S` sur tous les fichiers avant de tester |
| Dossier `app/` racine en conflit avec `src/app/` | Copie depuis `portfolio-temp` avait créé un `app/` à la racine | `rm -rf app/` |
| UTF-8 invalide dans `page.tsx` | `cat >` dans le terminal corrompt les caractères spéciaux | Toujours utiliser Cursor pour écrire le contenu — `touch` uniquement pour créer les fichiers vides |
| Warning middleware déprécié | Next.js 16 renomme `middleware.ts` en `proxy.ts` | `mv src/middleware.ts src/proxy.ts` + renommer la fonction |

### Décisions prises
| Décision | Raison |
|---|---|
| Next.js 16 + React 19 | Next.js 14 incompatible avec React 19 — stack actuelle stable et à jour |
| Tailwind v4 avec CSS variables | Plus flexible que `tailwind.config.ts`, natif v4 |
| Style mixte Tailwind + CSS variables | Tailwind pour le layout, variables pour les couleurs du thème |
| `proxy.ts` au lieu de `middleware.ts` | Convention Next.js 16 — même logique, nouveau nom |
| Terminal uniquement pour `touch` | `cat >` corrompt les caractères spéciaux — Cursor pour le contenu |

### Prochaine session
- [ ] Créer le callback route `/auth/callback/route.ts`
- [ ] Créer la page `/dashboard/page.tsx`
- [ ] Tester le flux complet : login → dashboard → redirect si non connecté
- [ ] Fermer TASK-006 sur GitHub

## Session 4 — [19/03/2026]

### Contexte
Audit et hardening de l'infrastructure agents Claude Code.
Objectif : créer des skills robustes pour le workflow dev + test.

### Ce qu'on a fait
- [x] Audit complet des skills agents v1 contre la doc officielle Anthropic
- [x] 12 problèmes identifiés (5 critiques, 7 moyens)
- [x] Skills v2 rédigés et adaptés au vrai projet
- [x] Décision : pas de MCP GitHub (overhead tokens, fichiers locaux suffisent)
- [x] Structure `.claude/` complète produite (7 fichiers)

### Fichiers créés
```
.claude/
├── agents/
│   ├── dev-agent.md
│   └── test-agent.md
└── skills/
    ├── dev-workflow/
    │   ├── SKILL.md
    │   └── references/
    │       ├── conventions.md
    │       └── schema.md
    └── test-workflow/
        ├── SKILL.md
        └── references/
            └── checklist-regression.md
```

### Décisions prises
| Décision | Raison |
|---|---|
| Pas de MCP GitHub | Overhead tokens trop élevé, fichiers locaux plus efficaces |
| `context: fork` dans les skills | Chaque skill tourne dans un subagent isolé |
| Agent test en read-only (tools: Read, Glob, Grep, Bash) | Garde-fou technique |
| Formules financières : pointeur vers CLAUDE.md | Source de vérité unique |
| Descriptions en anglais dans les skills | Meilleur matching pour le trigger automatique |
| Progressive disclosure via `references/` | Économie de tokens, chargé à la demande |

### Prochaine session

#### Priorité 1 : Intégrer les fichiers .claude/ dans le repo
- [ ] Commit : `chore: add Claude Code agents and skills configuration`

#### Priorité 2 : Reprendre le dev (TASK-006 Auth)
- [ ] Créer le callback route `/auth/callback/route.ts`
- [ ] Créer la page `/dashboard/page.tsx`
- [ ] Tester le flux complet : login → callback → dashboard → redirect si non connecté
- [ ] Fermer TASK-006 sur GitHub

#### Priorité 3 : Tester les agents (quand accès Mac)
- [ ] Ouvrir Claude Code dans le repo
- [ ] Tester `/dev-workflow` sur TASK-006
- [ ] Tester `/test-workflow` après implémentation
- [ ] Vérifier que l'agent test produit un rapport structuré
- [ ] Ajuster les skills selon les résultats réels

---

## Session 5 — [20/03/2026]

### Contexte
Review stratégique MVP + installation skills Vercel + validation workflow agents.

### Ce qu'on a fait
- [x] Phase 1 : Review stratégique avec Tech Lead (en cours en parallèle)
- [x] Phase 2 : Installation des 3 skills Vercel (`vercel-react-best-practices`, `next-best-practices`, `next-cache-components`)
- [x] Phase 3 : TASK-006 Auth — validée lors d'une session précédente
- [x] Phase 4 : FIX-001 — remplacement `style={{}}` par classes Tailwind — PASS, ticket #42 fermé
- [x] Phase 5 : Test workflow agents sur TASK-043 (API Routes prix temps réel)
  - `/dev-workflow` : implémentation des routes `/api/quote` et `/api/exchange-rate`
  - `/test-workflow` : PASS avec réserve mineure (CA5 faux positif théorique)
  - Anomalie détectée : `next lint` supprimé en Next.js 16 → ticket #44 créé
- [x] TASK-043 fermée, commit `feat: ajouter les API routes`

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `npx skills add vercel-labs/agent-skills@react-best-practices` échoue | Mauvais nom de skill | Skill s'appelle `vercel-react-best-practices` — vérifier avec `npx skills list` d'abord |
| `npm run lint` / `next lint` échoue | `next lint` supprimé dans Next.js 16 | Remplacer par `npx eslint src --ext .ts,.tsx` — ticket #44 créé |

### Décisions prises
| Décision | Raison |
|---|---|
| Skills Vercel installés en local (`.agents/skills/`) | Chargés automatiquement par Claude Code sur le code Next.js/React |
| Ticket #44 créé pour le script lint | Bloque les pré-checks de l'agent test sur tous les tickets suivants |

### Décisions Tech Lead (Phase 1)
- DCA (EPIC #4, US #22 #23 #24) → basculé en v1.5, label `v1.5` ajouté sur GitHub
- Chemin critique MVP validé : Auth → API Routes → US-001 → US-002 → US-005 → US-006 → Prod

### Prochaine session (Session 6)
- [ ] FIX : Corriger `npm run lint` dans package.json (#44) — bloque les pré-checks agent test
- [ ] US-001 (#12) : Ajouter une position manuellement (formulaire + insert Supabase)
- [ ] US-002 (#13) : Voir la liste des positions (tableau + données Supabase)
- [ ] Seed data : 3-4 positions de test avant US-002

---

## Session 6 — [23/03/2026]

### Contexte
Migration DB + préparation session de dev US-001 / US-002.
Objectifs : FIX-#44, US-001 (ajout position), US-002 (liste positions).

### Ce qu'on a fait
- [x] Décision architecture : ajout colonne `type` (stock/etf/crypto) à la table `positions`
- [x] Migration SQL créée : `supabase/migrations/20260323000000_add_asset_type_to_positions.sql`
  - Enum PostgreSQL `asset_type` avec valeurs `'stock'`, `'etf'`, `'crypto'`
  - Colonne `type asset_type NOT NULL DEFAULT 'stock'` ajoutée entre `ticker` et `name`
- [x] Migration appliquée en local via `supabase db reset` (confirmé via debug)
- [x] Migration appliquée en remote via `supabase db push`
- [x] Types TypeScript régénérés : `src/types/database.ts` reflète le nouvel enum

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `supabase db reset` échoue sans flag | Timeout container sans debug mode | Relancer avec `--debug` — le reset s'est exécuté correctement |

### Décisions prises
| Décision | Raison |
|---|---|
| Enum PostgreSQL `asset_type` (pas `TEXT CHECK`) | Contrainte d'intégrité forte au niveau DB, valeurs strictement bornées, type TypeScript automatiquement généré |
| `DEFAULT 'stock'` sur la colonne | Valeur la plus courante — évite les erreurs si le champ est omis temporairement |

### Ce qu'on a fait (suite — implémentation)
- [x] FIX-#44 : `package.json` — `next lint` remplacé par `npx eslint src --ext .ts,.tsx`
- [x] US-001 (#12) : API Route `POST /api/positions` + `GET /api/positions` avec auth Supabase
- [x] US-001 (#12) : Composant `AddPositionForm.tsx` — formulaire 7 champs avec nom auto-rempli
- [x] US-001 (#12) : Composant `TickerInput.tsx` — auto-complétion debounce 500ms, feedback visuel 4 états
- [x] US-001 (#12) : Wrapper `PositionsSectionClient.tsx` — relie `router.refresh()` à `onPositionAdded`
- [x] US-002 (#13) : Server Component `PositionsTable.tsx` — 10 colonnes, tri valeur décroissante, poids %
- [x] US-002 (#13) : `dashboard/page.tsx` mis à jour — intègre formulaire + tableau
- [x] `/api/quote` enrichi — retourne `name` via Finnhub `/stock/profile2` en parallèle du prix

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `database.ts` ligne 1 : `Connecting to db 5432` | Artefact `supabase gen types` — texte de debug injecté en début de fichier | Supprimer manuellement la ligne 1 après chaque `supabase gen types` |
| `setState` synchrone dans `useEffect` | ESLint `react-hooks/set-state-in-effect` interdit les setState directs dans le corps d'un effet | Déplacer le reset dans `handleChange`, mettre `setState` à l'intérieur du callback async |
| `AddPositionForm` > 200 lignes | Logique ticker + debounce mélangée au formulaire | Extraire dans `TickerInput.tsx` — formulaire retombe à 176 lignes |

### Décisions prises
| Décision | Raison |
|---|---|
| `router.refresh()` dans le wrapper client | Recharge le Server Component `PositionsTable` après ajout sans state global |
| ETF mappé sur `stock` pour `/api/quote` | Finnhub traite les ETF comme des actions — route n'accepte que `stock` ou `crypto` |
| `TickerInput` en composant séparé | Responsabilité unique + respect limite 200 lignes |
| Appels Finnhub quote + profile2 en `Promise.all` | Temps d'attente identique, double information récupérée |
| Nom crypto = capitalize du coinId | CoinGecko `/simple/price` ne retourne pas le nom — évite un appel supplémentaire pour un gain marginal |

---

## Session 7 — [23/03/2026]

### Contexte
Amélioration du formulaire d'ajout de position avant les US-005/006.
Objectifs : champ ISIN, recherche par nom/ticker, migration Yahoo Finance.

### Ce qu'on a fait
- [x] **Champ ISIN ajouté** au formulaire `AddPositionForm` — optionnel, saisi manuellement ou auto-rempli par recherche ISIN
- [x] **Recherche auto par ISIN** — dès 12 caractères saisis, appel `/api/search` qui auto-remplit ticker + nom + type
- [x] **Nouveau composant `SearchInput.tsx`** — remplace `TickerInput`, dropdown de suggestions debounce 400ms, actif sur les champs Ticker ET Nom
- [x] **Nouvelle route `/api/search`** — recherche par nom ou ticker (Yahoo Finance pour stocks/ETF, CoinGecko pour crypto), retourne max 8 résultats `{ ticker, name, type }`
- [x] **Migration Yahoo Finance** — `/api/quote` et `/api/search` migrent de Finnhub vers Yahoo Finance pour les stocks/ETF (couverture mondiale US + Europe), CoinGecko conservé pour la crypto
- [x] **PEA-PME retiré** du select Enveloppe
- [x] **`/api/positions` enrichi** — champ `isin` ajouté dans le payload POST et l'insert Supabase

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| Finnhub plan gratuit = US uniquement | 403 Forbidden sur les tickers européens (.PA, .MI…) | Migration complète vers Yahoo Finance — pas de clé API, couverture mondiale |
| Fallback Yahoo non déclenché | `ApiError` lancée avec `httpStatus: 503` même pour un 403 Finnhub — condition `err.httpStatus === 403` jamais vraie | Résolu en migrant directement vers Yahoo sans fallback |
| `setState` synchrone dans `useEffect` (ISIN lookup) | ESLint `react-hooks/set-state-in-effect` | Déplacer `setIsinStatus('idle')` dans `handleChange` |

### Décisions prises
| Décision | Raison |
|---|---|
| Yahoo Finance remplace Finnhub (pas fallback) | Finnhub gratuit = US seulement, Yahoo couvre tout sans clé API — inutile de maintenir deux sources |
| CoinGecko supprimé, Yahoo pour la crypto aussi | Tickers Yahoo (`BTC-EUR`, `ETH-USD`) plus naturels — une seule source pour tout |
| ISIN lookup déclenché à 12 caractères | Format ISIN = toujours exactement 12 chars — déclenchement fiable sans bouton |
| `FINNHUB_API_KEY` supprimé du `.env.local` | Plus nécessaire — simplification de la configuration |

### Corrections post-commit (suite S7)
- [x] Bug `PositionsTable` : fetch HTTP interne sans cookies → Supabase rejetait la requête → tableau toujours vide. Fix : requête Supabase directe dans le Server Component
- [x] Bug devises : Yahoo retourne USD pour les actions US, affiché en "€" sans conversion. Fix : conversion USD→EUR + GBp/GBP via Frankfurter dans `PositionsTable`
- [x] Bug crypto : `BTC-EUR` sans prix — CoinGecko supprimé, Yahoo Finance gère tout (stocks + ETF + crypto). Ticker crypto format Yahoo : `BTC-EUR`, `ETH-USD`
- [x] Bug UX : dropdown suggestions restait ouvert après sélection. Fix : `justSelectedRef` bloque la re-recherche déclenchée par le changement de `value`
- [x] ISIN depuis suggestion : après sélection, appel silencieux `/api/quote` → si Yahoo retourne `meta.isin`, champ ISIN pré-rempli automatiquement

---

## Session 8 — [25/03/2026]

### Contexte
US-005 (polling auto) + US-006 (vue globale) + correction dette technique.
Alignement avec recommandations Anthropic : critères d'acceptation explicites par ticket + test-agent systématique.

### Ce qu'on a fait
- [x] **US-005** — `PositionsSectionClient.tsx` : `setInterval` 60s → `router.refresh()` + cleanup `clearInterval`. Constante `REFRESH_INTERVAL_MS = 60_000`.
- [x] **US-006** — `src/components/portfolio/PortfolioSummary.tsx` créé : Server Component, requête Supabase directe, 4 cartes (total investi, valeur actuelle, P&L€, P&L%), grille responsive `grid-cols-2 sm:grid-cols-4`.
- [x] **`src/lib/quote.ts` créé** — `fetchQuote`, `fetchRate`, `toEur` extraits en lib partagée, wrappés avec `cache()` de React 19 pour dédupliquer les appels entre `PortfolioSummary` et `PositionsTable` dans le même cycle de rendu.
- [x] **`src/lib/format.ts` créé** — `formatEur` et `formatPct` extraits en source unique (suppression des doublons dans les deux composants).
- [x] **`PositionsTable.tsx` allégé** — import depuis `@/lib/quote` et `@/lib/format`, suppression des fonctions locales et du fetch HTTP interne résiduel.
- [x] **`dashboard/page.tsx`** — `PortfolioSummary` ajouté avant le formulaire et le tableau.

### Décisions prises
| Décision | Raison |
|---|---|
| `cache()` React sur `fetchQuote`/`fetchRate` | Déduplique les appels réseau si deux Server Components appellent la même fonction dans le même rendu — pas de refacto props nécessaire |
| `src/lib/format.ts` | Source unique pour le formatage monétaire — cohérence garantie entre tous les composants |
| `select('id, ticker, quantity, pru')` dans PortfolioSummary | Minimise la charge réseau — seuls les champs nécessaires aux calculs |
| `return null` si aucune position | Pas de bloc vide affiché |
| SESSION.md : critères d'acceptation + protocole test-agent | Alignement recommandations Anthropic engineering (article harness-design-long-running-apps) |

---

---

## Session 9 — [25/03/2026]

### Contexte
US-004 (suppression position) + Supabase prod + déploiement Vercel. Premier MVP en ligne.

### Ce qu'on a fait
- [x] **US-004** — `DELETE /api/positions/[id]` + `DeletePositionButton` Client Component (confirmation, état loading, message d'erreur visible, count null géré)
- [x] **Supabase prod** — projet créé sur supabase.com (West EU Ireland), `supabase link` + `db push` — 6 tables + RLS appliqués
- [x] **Vercel** — déploiement via CLI, 3 variables d'environnement configurées (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- [x] **Email confirmation désactivée** — Supabase Auth, plan free limité à 3 emails/heure

### Problèmes rencontrés
| Problème | Cause | Fix |
|---|---|---|
| Build Vercel échoue (1er deploy) | Variables d'environnement Supabase manquantes | Ajout via `vercel env add` |
| Crash dashboard en prod (digest 305880392) | `SUPABASE_SERVICE_ROLE_KEY` manquante | Ajout de la variable secrète dans Vercel |
| Email rate limit exceeded | Plan free Supabase = 3 emails/heure | Désactivation confirmation email dans Auth settings |

### URL de production
https://portfolio-zeta-fawn-73.vercel.app

---

*Dernière mise à jour : Session 9 — 25/03/2026*
