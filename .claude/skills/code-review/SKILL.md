---
name: code-review
description: "Workflow de code review structuré pre-commit. Déclencher après le dev-agent, ou quand on dit 'review', 'vérifie le code', 'avant de commit'."
agent: code-reviewer
context: fork
metadata:
  version: "1.0"
---

# Code Review Workflow

## Quand utiliser
- Après chaque implémentation du dev-agent, avant le commit
- Quand le PO veut une vérification supplémentaire

## Étapes

### 1. Vérification automatique
```bash
npm run build
npx tsc --noEmit
npm run lint
```

### 2. Review manuelle
- Lire chaque fichier modifié (git diff ou Read)
- Vérifier contre `.claude/rules/coding-style.md`
- Vérifier contre `.claude/rules/security.md`

### 3. Points de contrôle
- [ ] Conventions nommage respectées
- [ ] Pas de `any` TypeScript
- [ ] Pas de `style={{}}` non justifié
- [ ] Pas de secret exposé côté client
- [ ] Pas de fichier > 200 lignes
- [ ] Server vs Client components correct
- [ ] Périmètre ticket respecté

### 4. Rapport
Format : OK / Warning / Bloquant pour chaque point
Si Bloquant → retour au dev-agent avec instructions précises
