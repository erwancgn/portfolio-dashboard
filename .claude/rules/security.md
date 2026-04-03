# Sécurité

## Règles absolues

- Ne jamais lire, afficher ou utiliser le contenu de `.env.local`
- Ne jamais accéder aux credentials de production
- Ne jamais exposer une clé API dans le code côté client
- Toutes les clés secrètes restent dans les variables d'environnement serveur uniquement
- Ne jamais modifier la base de données de production

## Clés API

Les appels aux APIs externes (Yahoo Finance, Frankfurter, FMP) se font uniquement depuis `src/app/api/*` — jamais depuis un composant client ou une fonction utilitaire importée côté client.

## Base de données

- Toujours travailler sur l'environnement local (Docker + Supabase CLI)
- Ne jamais exécuter de migrations sans validation PO
- Ne jamais modifier les fichiers dans `supabase/migrations/` existants
