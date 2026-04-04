---
name: dev-workflow
description: "Implements feature tickets for the Portfolio Dashboard (Next.js 16 / Supabase / TypeScript). Triggers on: ticket implementation, feature development, GH-xxx references, building new components or API routes, database schema changes, any coding task on the portfolio project. Use when the user says 'implémente', 'code', 'développe', 'crée', or references a specific ticket."
context: fork
agent: dev-agent
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
metadata:
  version: "3.0"
  last-updated: "2026-04-04"
---

# Dev Workflow — Portfolio Dashboard

Invoquer le `dev-agent` en lui fournissant le numéro de ticket.

## Rappels spécifiques au projet

**Localisation des fichiers :**

| Type | Emplacement | Nommage |
|------|-------------|---------|
| Page | `src/app/xxx/page.tsx` | kebab-case dossier |
| Composant | `src/components/xxx.tsx` | PascalCase fichier |
| API Route | `src/app/api/xxx/route.ts` | kebab-case dossier |
| Util/Helper | `src/lib/xxx.ts` | camelCase fichier |

**Escalade obligatoire (STOP + demander au PO) :**
- Nouveau modèle de données ou modification de table existante
- Nouvelle dépendance npm à installer
- Impact > 5 fichiers existants
- Choix entre deux approches d'architecture → tech-lead

**Si la tâche touche la DB :** lire `.claude/skills/dev-workflow/references/schema.md`.

Voir `.claude/rules/` pour les conventions complètes.
