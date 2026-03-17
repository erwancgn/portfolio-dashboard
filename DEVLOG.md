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
