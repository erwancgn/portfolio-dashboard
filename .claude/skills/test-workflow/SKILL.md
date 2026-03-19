---
name: test-workflow
description: "Verifies acceptance criteria and runs QA checks for the Portfolio Dashboard project. Triggers on: test verification, QA check, acceptance criteria validation, regression testing, after any dev-workflow completion. Use when the user says 'vérifie', 'teste', 'check', 'valide', 'QA', or asks to verify a ticket."
context: fork
agent: test-agent
---

# Test Workflow — Portfolio Dashboard

## Processus de vérification

### Étape 1 — Pré-checks automatiques

Exécuter ces commandes et reporter les résultats :
```bash
npm run build          # Build réussi ?
npx tsc --noEmit       # Pas d'erreur TypeScript ?
npm run lint           # Pas de warning ESLint ?
```

### Étape 2 — Critères d'acceptation

Pour chaque critère d'acceptation du ticket :
1. Identifier le comportement attendu
2. Trouver le code qui l'implémente (Grep/Glob)
3. Vérifier la logique manuellement
4. Reporter le résultat

### Étape 3 — Vérifications spécifiques

**Si le ticket touche des calculs financiers :**
- Comparer les formules implémentées avec celles de CLAUDE.md (section "Calculs financiers")
- Vérifier les cas limites : division par zéro, quantité nulle, valeur négative
- Vérifier que les pourcentages somment à 100% quand applicable
- Vérifier la précision décimale (centimes vs euros)

**Si le ticket touche l'authentification :**
- Vérifier que `proxy.ts` gère la redirection correctement
- Vérifier que les Server Components utilisent le client serveur Supabase
- Vérifier que les Client Components utilisent le client browser Supabase
- Vérifier que RLS est activé sur les tables concernées

**Si le ticket touche une API Route :**
- Vérifier que la route est dans `src/app/api/*`
- Vérifier qu'aucune clé secrète n'est exposée côté client
- Vérifier la gestion d'erreur (try/catch, status codes)

### Étape 4 — Régression

Vérifier que les fonctionnalités des sessions précédentes fonctionnent toujours :
- Les imports et exports ne sont pas cassés
- Les types n'ont pas changé de signature sans raison
- La page de login reste accessible sur `/auth/login`

### Étape 5 — Conventions

Vérifier la conformité avec CLAUDE.md :
- Pas de `any` en TypeScript
- Pas de `style={{}}` inline
- Pas de `NEXT_PUBLIC_` sur une clé secrète
- Fichiers < 200 lignes
- Nommage correct (camelCase variables, PascalCase composants, kebab-case fichiers)

## Format du rapport
```markdown
# Rapport QA — [Ticket ID]
Date : [date]

## Pré-checks
- Build : ✅/❌
- TypeScript : ✅/❌ (X erreurs)
- Lint : ✅/❌ (X warnings)

## Critères d'acceptation
| # | Critère | Statut | Détail |
|---|---------|--------|--------|
| 1 | ...     | ✅/❌  | ...    |

## Vérifications spécifiques
- [Section selon le type de ticket]

## Régression
- [Points vérifiés]

## Conventions
- [Violations trouvées ou "Aucune violation"]

## Verdict

## Nouvelles leçons (si applicable)
- [Entrées à ajouter à LESSONS.md si des erreurs ou comportements inattendus ont été détectés]
  Format : [SX] contexte → règle
```

**Récap de l'architecture de mémoire finale :**
```
CLAUDE.md      → Règles permanentes (ne change quasi jamais)
SESSION.md     → Contexte immédiat (réécrit à chaque session)
LESSONS.md     → Mémoire des erreurs (grandit lentement, plafonné ~100 lignes)
DEVLOG.md      → Journal complet pour toi (grandit librement, pas lu par l'agent)
🟢 PASS / 🔴 FAIL — [Raison si fail]
```
