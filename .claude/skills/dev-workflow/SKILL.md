---
name: dev-workflow
description: "Implements feature tickets for the Portfolio Dashboard (Next.js 16 / Supabase / TypeScript). Triggers on: ticket implementation, feature development, US-xxx or TASK-xxx references, building new components or API routes, database schema changes, any coding task on the portfolio project. Use when the user says 'implémente', 'code', 'développe', 'crée', or references a specific ticket."
context: fork
agent: dev-agent
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
metadata:
  version: "2.1"
  last-updated: "2026-03-19"
---

# Dev Workflow — Portfolio Dashboard

## Avant de coder

1. **Lire SESSION.md** pour le contexte de la session en cours
2. **Lire LESSONS.md** pour les erreurs à ne pas refaire
3. **Lire le ticket GitHub** : `gh issue view <numéro> --repo erwancgn/portfolio-dashboard`
4. **Identifier les critères d'acceptation** dans le body du ticket
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

- ## Gotchas — pièges connus

- `proxy.ts` pas `middleware.ts` — Next.js 16 a renommé, mais les tutos en ligne utilisent encore l'ancien nom
- `src/types/database.ts` est auto-généré — si tu le modifies, la prochaine regénération écrase tout
- `createClient` existe en 2 versions (browser et server) — utiliser la mauvaise = erreur silencieuse de RLS
- Tailwind v4 n'a pas de `tailwind.config.ts` — tout est dans `globals.css`, Cursor affiche un warning mais ça fonctionne

## Escalade obligatoire — STOP et demander au PO

Ne pas coder si l'un de ces cas se présente. Documenter la question et attendre :
- Nouveau modèle de données ou modification de table existante
- Choix entre deux approches d'architecture
- Nouvelle dépendance npm à installer
- Impact sur plus de 5 fichiers existants
- Doute sur le périmètre du ticket (vérifier "Hors périmètre" dans le ticket)

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
