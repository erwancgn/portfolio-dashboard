# Workflow Git

## Règles absolues

- Ne jamais faire `git push` de façon autonome
- Ne jamais commiter sans validation explicite du PO
- Chaque commit doit être validé et compris par le PO avant d'être exécuté

## Format des commits

Format conventionnel obligatoire :
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation uniquement
- `chore:` maintenance, config, dépendances
- `test:` ajout ou correction de tests

Inclure le numéro de ticket quand applicable : `fix(#74): description`

## Workflow documentation (zéro conflit merge)

**Dans la branche feature : CODE UNIQUEMENT**
- Implémenter la tâche
- Commit code avec message détaillé
- Ne PAS modifier SESSION.md, DEVLOG.md, CHANGELOG.md, ARCHITECTURE.md

**Après merge vers main : MISE À JOUR DOCUMENTATION**
- `SESSION.md` — résumé session, tickets complétés
- `DEVLOG.md` — contexte, root causes, solutions, fichiers modifiés
- `CHANGELOG.md` — si fonctionnalité user-facing livrée
- `ARCHITECTURE.md` — si décision technique majeure

**Raison :** SESSION.md et DEVLOG.md sont des fichiers "consolidation". Les mettre à jour dans main post-merge évite les conflits et reflète l'état réel du code.

**Exemple correct :**
```
feature branch: git commit fix(#74): Fair Value bugs (code only)
             → git merge → main (no conflicts)
main:        git commit docs: update SESSION/DEVLOG for #74 (post-merge)
             → git push origin main
```
