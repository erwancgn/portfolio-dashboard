# Stack — Règles et conventions

## Next.js 16

- Fichier proxy : `proxy.ts` (pas `middleware.ts` — renommé en Next.js 16)
- Server Components par défaut — ajouter `'use client'` uniquement si interaction utilisateur ou hooks React
- Tous les appels APIs externes (Yahoo Finance, FMP, Frankfurter) dans `src/app/api/*` uniquement — jamais depuis un composant ou lib client
- Pas de `tailwind.config.ts` — toute la config Tailwind est dans `globals.css`

## Supabase

- **Dev** : `localhost:3000` — Supabase Docker local (bandeau orange)
- **Prod** : Vercel — déployé via `git push main`
- `createClient` existe en 2 versions — utiliser la mauvaise = erreur silencieuse RLS :
  - **Browser** : `src/lib/supabase/client.ts` — composants `'use client'`
  - **Server** : `src/lib/supabase/server.ts` — Server Components et Route Handlers
- `src/types/database.ts` est **auto-généré** (`npx supabase gen types typescript --local`) — ne jamais modifier manuellement, toujours vérifier les noms exacts de colonnes/tables avant usage
- Ne jamais exécuter de migrations sans validation PO
- Ne jamais modifier les fichiers `supabase/migrations/` existants

## Sécurité

- Ne jamais lire, afficher ou utiliser `.env.local` ou tout credential
- Clés API uniquement dans les variables d'environnement serveur — jamais côté client
- Ne jamais modifier la base de données de production

## Tailwind v4

- `style={{}}` autorisé **uniquement** pour les valeurs CSS calculées dynamiquement (`width: X%`, `fill=` SVG, valeurs numériques runtime)
- Pas de `shadow-lg` / `shadow-xl`, pas de `border-2+`, pas de couleurs vives en fond
- Style minimaliste inspiré Trade Republic + Moning
