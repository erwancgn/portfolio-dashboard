---
name: test-workflow
description: "Verifies acceptance criteria and runs QA checks for the Portfolio Dashboard project. Triggers on: test verification, QA check, acceptance criteria validation, regression testing, after any dev-workflow completion. Use when the user says 'vérifie', 'teste', 'check', 'valide', 'QA', or asks to verify a ticket."
context: fork
agent: test-agent
allowed-tools: Read, Glob, Grep, Bash
metadata:
  version: "2.2"
  last-updated: "2026-04-03"
---

# Test Workflow — Portfolio Dashboard

## Processus de vérification

Utilise les checklists `.claude/checklists/story-dod.md` et `.claude/checklists/pre-commit.md` comme base.

### Étape 0 — Lire le ticket backlog

Récupérer le ticket local dans `.claude/backlog` pour connaître les critères d'acceptation :
- Chercher `GH-<numéro>.md` dans `.claude/backlog/Task/`, `.claude/backlog/Story/` ou `.claude/backlog/Epic/`
- Source de vérité: `.claude/backlog/**/GH-<numéro>.md` (et non GitHub)

Identifier :
- Les **critères d'acceptation** (lignes `- [ ] CA...`)
- Les **fichiers concernés**
- Le **hors périmètre** (ne pas vérifier ce qui est explicitement exclu)
- Le **Definition of Done**

### Étape 1 — Pré-checks automatiques

Exécuter ces commandes et reporter les résultats :
```bash
npm run build          # Build réussi ?
npx tsc --noEmit       # Pas d'erreur TypeScript ?
npm run lint           # Pas de warning ESLint ?
```

### Étape 2 — Critères d'acceptation

Pour chaque critère d'acceptation du ticket backlog :
1. Identifier le comportement attendu
2. Trouver le code qui l'implémente (Grep/Glob)
3. Vérifier la logique manuellement
4. Reporter le résultat

### Étape 3 — Vérifications spécifiques

**Si le ticket touche des calculs financiers :**
- Comparer les formules implémentées avec celles de `.claude/skills/finance-formulas/SKILL.md`
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

Vérifier les points dans `references/checklist-regression.md` et :
- Les imports et exports ne sont pas cassés
- Les types n'ont pas changé de signature sans raison
- La page de login reste accessible sur `/auth/login`

### Étape 5 — Conventions

Vérifier la conformité avec `.claude/rules/` :
- Pas de `any` en TypeScript
- Pas de `style={{}}` inline
- Pas de `NEXT_PUBLIC_` sur une clé secrète
- Fichiers < 200 lignes
- Nommage correct (camelCase variables, PascalCase composants, kebab-case fichiers)

- ## Gotchas — faux positifs à éviter

- Un warning `@theme` dans `globals.css` n'est PAS une erreur — c'est Tailwind v4, ignorable
- `npm run lint` peut remonter des warnings sur les imports — vérifier si c'est un vrai problème ou un faux positif ESLint
- Le fichier `src/types/database.ts` peut sembler "non conforme" car il est auto-généré — ne pas le signaler comme violation

## Format du rapport

```markdown
# Rapport QA — [GH-XX] Titre du ticket
Ticket backlog : `.claude/backlog/<Type>/GH-XX.md`
Date : [date]

## Pré-checks
- Build : ✅/❌
- TypeScript : ✅/❌ (X erreurs)
- Lint : ✅/❌ (X warnings)

## Critères d'acceptation
| # | Critère (depuis le ticket backlog) | Statut | Détail |
|---|----------------------------------|--------|--------|
| CA1 | ...                            | ✅/❌  | ...    |
| CA2 | ...                            | ✅/❌  | ...    |

## Vérifications spécifiques
- [Section selon le type de ticket]

## Régression
- [Points vérifiés depuis checklist-regression.md]

## Conventions
- [Violations trouvées ou "Aucune violation"]

## Leçons capturées
Si l'un de ces cas s'est produit pendant la vérification, proposer une entrée LESSONS.md :
- Une commande ou opération a échoué de manière inattendue
- Un pattern de code incorrect a été détecté
- Un comportement de build/TypeScript/lint surprenant a été observé
- Une incohérence entre le schéma DB et le code a été trouvée
- Un cas limite non géré a été identifié

Format : `[SX] contexte → règle`
Si aucune leçon : "Aucune nouvelle leçon."

## Verdict
🟢 PASS / 🔴 FAIL — [Raison si fail]
```

## Clôture du ticket backlog

Quand un ticket est **traité et validé comme terminé** (PASS QA + validation PO) :
1. Déplacer le fichier ticket depuis `.claude/backlog/<Type>/GH-XX.md`
2. Vers `.claude/backlog/Done/GH-XX.md`
3. Garder le même nom de fichier pour préserver l'historique et garder un backlog actif propre
