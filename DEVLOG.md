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
| `gh issue close` multi-args | Syntaxe incorrecte | Fermer une issue à la fois |

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
