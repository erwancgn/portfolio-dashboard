---
name: dev-workflow
description: "Implements feature tickets for the Portfolio Dashboard (Next.js 16 / Supabase / TypeScript). Triggers on: ticket implementation, feature development, US-xxx or TASK-xxx references, building new components or API routes, database schema changes, any coding task on the portfolio project. Use when the user says 'implémente', 'code', 'développe', 'crée', or references a specific ticket."
context: fork
agent: dev-agent
---

# Dev Workflow — Portfolio Dashboard

## Avant de coder

1. **Lire SESSION.md** pour le contexte de la session en cours
2. **Lire LESSONS.md** pour les erreurs à ne pas refaire
3. **Identifier le ticket** : quel US/TASK, quels critères d'acceptation
4. **Lire les fichiers impactés** avec Read/Glob avant toute modification
5. **Vérifier `src/types/database.ts`** pour les noms de colonnes et tables exacts
6. **Si la tâche touche la DB** : lire `references/schema.md` pour le schéma complet (6 tables, RLS, index)

## Exécution

Pour chaque critère d'acceptation du ticket :
1. Identifier les fichiers à créer ou modifier
2. Implémenter en respectant les conventions (voir CLAUDE.md)
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

## Rappels architecture

- `proxy.ts` (pas `middleware.ts`) — convention Next.js 16
- Server Components par défaut, `'use client'` uniquement si interaction
- APIs externes (Finnhub, CoinGecko, Frankfurter) → uniquement dans `src/app/api/*`
- Tailwind v4 pour layout, CSS variables pour couleurs thème
- Types DB générés automatiquement — ne jamais modifier `src/types/database.ts` manuellement

## Escalade obligatoire — STOP et demander au PO

Ne pas coder si l'un de ces cas se présente. Documenter la question et attendre :
- Nouveau modèle de données ou modification de table existante
- Choix entre deux approches d'architecture
- Nouvelle dépendance npm à installer
- Impact sur plus de 5 fichiers existants
- Doute sur le périmètre du ticket

## Après le code

1. Expliquer ce qui a été fait et pourquoi
2. Lister les fichiers modifiés/créés
3. Proposer le message de commit (format conventionnel)
4. Attendre la validation PO avant tout commit
