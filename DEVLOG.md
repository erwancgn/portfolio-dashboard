# DEVLOG — Portfolio Dashboard IA

> Règle : chaque session commence par lire ce fichier.
> Chaque session se termine par le mettre à jour.
> Ce fichier est le garde-fou contre les erreurs répétées et la perte de contexte IA.

---

## Session 1 — [16/03/2026]

### Contexte
Démarrage du projet. Mise en place de l'environnement et de la documentation.

### Ce qu'on a fait
- [x] Brainstorming produit complet (métier, UX, architecture, agents IA, risques, coûts)
- [x] Cahier des charges rédigé
- [x] Backlog modélisé (EPIC / US / TASK)
- [x] Décisions d'architecture actées
- [x] Installation nvm + Node.js v20 LTS
- [x] Initialisation Git
- [x] Création des 4 fichiers de documentation
- [x] Projet Next.js créé et fonctionnel sur localhost:3000

### Erreurs rencontrées
| Erreur | Cause | Solution |
|---|---|---|
| `Failed to clone nvm repo` | Licence Xcode non acceptée | `sudo xcodebuild -license` puis `agree` | | Commit avec fichiers vides | `git add` fait avant la sauvegarde des fichiers | Toujours `Cmd+S` avant `git add` | | `Cannot find module '../server/require-hook'` | `node_modules` copié manuellement via `cp -r` — les modules ne doivent jamais être copiés | `rm -rf node_modules && npm install` |
```

**Règle à retenir pour toute la suite :**
```
Cmd+S → git add . → git commit

### Décisions prises
| Décision | Raison |
|---|---|
| nvm plutôt que installation directe Node | Permet de gérer plusieurs versions (v12 existante + v20) |
| Documentation avant le code | Garde-fou contre perte de contexte IA + maintenabilité |
| Node v20 LTS | Stable, supporté jusqu'en 2026, requis par Next.js 14 |

### Prochaine session