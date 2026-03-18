# DEVLOG — Portfolio Dashboard IA

> Règle : chaque session commence par lire ce fichier.
> Chaque session se termine par le mettre à jour.
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

## Session 3 — [18/03/2026]

### Contexte
Configuration de l'authentification et des clients Supabase.
Objectifs : clients Supabase, types TypeScript, page de login, middleware auth.

### Ce qu'on a fait
- [x] Clients Supabase créés (browser + server)
- [x] Package @supabase/ssr installé
- [x] Types TypeScript générés depuis le schéma DB
- [x] Thème Tailwind v4 configuré dans globals.css
- [x] Middleware d'authentification créé
- [x] Page de login créée avec Tailwind v4
- [x] Alias @/* corrigé dans tsconfig.json (./src/* au lieu de ./*)

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `clients.ts` au lieu de `client.ts` | Typo à la création du fichier | `mv src/lib/supabase/clients.ts src/lib/supabase/client.ts` |
| `Cannot find module @/lib/supabase/client` | Alias @/* pointait vers ./ au lieu de ./src/ | Corriger tsconfig.json paths |
| `SyntaxError: Unexpected token '?'` | Node.js v12 actif au lieu de v20 | `nvm use 20` dans terminal Cursor |
| Next.js 16 installé au lieu de 14 | Copie depuis portfolio-temp | `npm install next@14.2.29 eslint-config-next@14.2.29` |
| `@theme` warning dans globals.css | Cursor ne reconnaît pas encore Tailwind v4 | Ignoré — fonctionne à l'exécution || Impossible de downgrader Next.js 14 | React 19 incompatible avec Next.js 14 (requiert React 18) | Décision : rester sur Next.js 16 + React 19 — stack actuelle stable || Page 404 persistante sur /auth/login | layout.tsx, page.tsx, globals.css non sauvegardés sur disque | Cmd+S sur tous les fichiers ouverts dans Cursor avant de tester || Dossier `app/` à la racine en conflit avec `src/app/` | Copie depuis portfolio-temp avait créé un dossier app/ à la racine — Next.js le prioritisait sur src/app/ | Supprimer app/ à la racine avec `rm -rf app/` |
| UTF-8 invalide dans page.tsx | `cat >` dans le terminal corrompt les caractères spéciaux | Toujours utiliser Cursor pour écrire le contenu — terminal uniquement pour créer les fichiers vides (`touch`) |

### Décisions prises
| Décision | Raison |
|---|---|
| Tailwind v4 avec CSS variables | Plus flexible que tailwind.config.ts, natif v4 |
| Rester sur Next.js 14 | Next.js 16 hors plage stable pour notre projet |
| Style mixte Tailwind + CSS variables | Tailwind pour le layout, variables pour les couleurs du thème |

### Prochaine session
- [ ] Vérifier que npm run dev fonctionne avec Next.js 14
- [ ] Tester la page de login sur localhost:3000/auth/login
- [ ] Créer le callback route `/auth/callback/route.ts`
- [ ] Créer la page `/dashboard/page.tsx`
- [ ] Tester le flux complet : login → dashboard → redirect si non connecté