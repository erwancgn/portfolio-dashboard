# Supabase — Règles et conventions

## Environnements

- **Dev** : `localhost:3000` — Supabase Docker local — bandeau orange
- **Prod** : Vercel — `git push main`

## Base de données

- Toujours travailler sur l'environnement local (Docker + Supabase CLI)
- Ne jamais exécuter de migrations sans validation PO
- Ne jamais modifier les fichiers dans `supabase/migrations/` existants
- Ne jamais modifier la DB de production

## Client Supabase

`createClient` existe en 2 versions selon le contexte :
- **Browser** : `src/lib/supabase/client.ts` — pour les composants `'use client'`
- **Server** : `src/lib/supabase/server.ts` — pour les Server Components et Route Handlers

Utiliser la mauvaise version = erreur silencieuse RLS (les données semblent retournées mais les règles de sécurité ne s'appliquent pas).

## Types

- `src/types/database.ts` est généré automatiquement via `npx supabase gen types typescript --local`
- Toujours vérifier les noms exacts de colonnes et tables dans ce fichier avant tout usage
- Ne jamais modifier ce fichier manuellement
