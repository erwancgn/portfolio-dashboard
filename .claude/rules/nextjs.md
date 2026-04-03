# Next.js 16 — Règles et conventions

## Fichiers spéciaux

- `proxy.ts` et non `middleware.ts` — Next.js 16 a renommé ce point d'entrée
- `src/types/database.ts` est généré automatiquement via `npx supabase gen types typescript --local` — ne jamais modifier manuellement, vérifier les noms exacts de colonnes et tables dans ce fichier avant tout usage

## Composants

- Server Components par défaut
- Ajouter `'use client'` uniquement si interaction utilisateur ou hooks React nécessaires
- Ne pas ajouter `'use client'` par défaut — coût inutile côté bundle

## APIs externes

- Tous les appels aux APIs externes (Yahoo Finance, Frankfurter, FMP) se font uniquement dans `src/app/api/*`
- Jamais d'appel API externe depuis un composant ou une lib côté client

## Tailwind v4

- Pas de `tailwind.config.ts` — toute la configuration est dans `globals.css`
- Voir `.claude/rules/tailwind.md` pour les détails
