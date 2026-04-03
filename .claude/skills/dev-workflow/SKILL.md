---
name: dev-workflow
description: "Implements feature tickets for the Portfolio Dashboard (Next.js 16 / Supabase / TypeScript). Triggers on: ticket implementation, feature development, US-xxx or TASK-xxx references, building new components or API routes, database schema changes, any coding task on the portfolio project. Use when the user says 'implémente', 'code', 'développe', 'crée', or references a specific ticket."
context: fork
agent: dev-agent
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
metadata:
  version: "2.2"
  last-updated: "2026-04-03"
---

# Dev Workflow — Portfolio Dashboard

## Avant de coder

1. **Le hook session-start a chargé le contexte** — vérifie la story/ticket assigné
2. **Lire LESSONS.md** pour les erreurs à ne pas refaire
3. **Lire le ticket local dans le backlog** :
   - Chercher `GH-<numéro>.md` dans `.claude/backlog/Task/`, `.claude/backlog/Story/` ou `.claude/backlog/Epic/`
   - Source de vérité: `.claude/backlog/**/GH-<numéro>.md` (et non GitHub)
4. **Identifier les critères d'acceptation** dans le ticket backlog (`## Critères d'acceptation`)
5. **Lire les fichiers impactés** (listés dans "Fichiers concernés" du ticket) avec Read/Glob
6. **Vérifier `src/types/database.ts`** pour les noms de colonnes et tables exacts
7. **Si la tâche touche la DB** : lire `references/schema.md` pour le schéma complet

## Exécution

**Si le ticket impacte 3+ fichiers, commencer par un plan :**
1. Lister les fichiers à modifier/créer et ce qui change dans chacun
2. Présenter le plan au PO pour validation
3. Implémenter seulement après validation du plan

**Pour chaque critère d'acceptation du ticket :**
1. Identifier les fichiers à créer ou modifier
2. Implémenter en respectant les conventions (voir `.claude/rules/`)
3. Vérifier que le build passe : `npm run build`
4. Préparer le commit avec message conventionnel

## Gestion des fichiers

| Type | Emplacement | Nommage |
|------|-------------|---------|
| Page | `src/app/xxx/page.tsx` | kebab-case dossier |
| Composant | `src/components/xxx.tsx` | PascalCase fichier |
| API Route | `src/app/api/xxx/route.ts` | kebab-case dossier |
| Type/Interface | `src/types/xxx.ts` | PascalCase pour les types |
| Util/Helper | `src/lib/xxx.ts` | camelCase fichier |
| Client Supabase | `src/lib/supabase/*.ts` | Ne pas modifier les existants |

## Validation
- Vérifie `.claude/checklists/pre-commit.md` avant de proposer le commit
- Vérifie `.claude/checklists/story-dod.md` si c'est une story BMAD

## Rappels
Voir `.claude/rules/` pour les conventions (nextjs, supabase, tailwind, coding-style).

## Escalade obligatoire — STOP et demander au PO

Ne pas coder si l'un de ces cas se présente. Documenter la question et attendre :
- Nouveau modèle de données ou modification de table existante
- Choix entre deux approches d'architecture
- Nouvelle dépendance npm à installer
- Impact sur plus de 5 fichiers existants
- Doute sur le périmètre du ticket (vérifier "Hors périmètre" dans le ticket backlog)

## Après le code — Explication obligatoire avant commit

Le PO apprend le développement à travers ce projet. Chaque changement doit être compréhensible.

**Pour chaque fichier modifié/créé, fournir :**
1. **Ce qui a changé** — en une phrase simple
2. **Pourquoi** — le lien avec le critère d'acceptation du ticket
3. **Ce qu'il faut retenir** — le concept clé que le PO doit comprendre

**Puis :**
4. Proposer le message de commit (format conventionnel)
5. Si une erreur a été rencontrée et corrigée : proposer une entrée pour `LESSONS.md` au format `[SX] contexte → règle`
6. Attendre la validation PO avant tout commit

## Clôture du ticket backlog

Quand un ticket est **traité et validé comme terminé** (implémentation + QA + validation PO) :
1. Déplacer le fichier ticket depuis `.claude/backlog/<Type>/GH-XX.md`
2. Vers `.claude/backlog/Done/GH-XX.md`
3. Garder le même nom de fichier pour préserver l'historique
