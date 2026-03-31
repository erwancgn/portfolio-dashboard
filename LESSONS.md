# LESSONS.md — Règles apprises des sessions passées

> Lu par les agents en début de chaque session.
> Chaque leçon = une erreur réelle → une règle concrète.
> Format : [SX] contexte → règle
> Plafonner à ~50 lignes. Si dépassé, archiver dans LESSONS_ARCHIVE.md.

---

## Next.js
- [S5] `next lint` / `npm run lint` supprimés en Next.js 16 → utiliser `npx eslint src --ext .ts,.tsx`
- [S7] Un Server Component ne doit PAS appeler ses propres API routes via `fetch` — les cookies de session ne sont pas transmis → requête Supabase directe obligatoire

## React / Composants
- [S6] `setState` synchrone dans le corps d'un `useEffect` → ESLint `react-hooks/set-state-in-effect` → déplacer dans `handleChange` ou dans le callback async
- [S6] Un Server Component ne peut pas avoir d'état interactif → anticiper un wrapper Client Component
- [S7] Après `onSuggestionSelected`, la prop `value` change → `useEffect` de recherche se re-déclenche → dropdown rouvre. Fix : `justSelectedRef = true` dans `handleSelect`

## Supabase / DB
- [S5] Skills Vercel : vérifier les noms exacts avec `npx skills list` avant d'installer
- [S6] `supabase gen types` peut injecter du texte de debug en ligne 1 → vérifier et nettoyer après régénération

## Déploiement Vercel
- [S9] Variables d'environnement Vercel : `NEXT_PUBLIC_*` via `vercel env add` suffisent pas — ajouter aussi les clés secrètes serveur (`SUPABASE_SERVICE_ROLE_KEY`) séparément, sans préfixe `NEXT_PUBLIC_`
- [S9] Supabase plan free = 3 emails auth/heure → désactiver "Confirm email" pour un projet MVP solo

## React / Performance
- [S8] Deux Server Components appelant la même fonction dans le même rendu → utiliser `cache()` de React 19 pour dédupliquer — la fonction n'est exécutée qu'une fois, le résultat est partagé

## Style / Conventions
- [S12] `style={{}}` est toléré uniquement pour les valeurs CSS calculées à l'exécution (ex: `width: X%` barre de progression) — impossible à exprimer en classe Tailwind statique
- [S12] Fichiers composants React → PascalCase (`AllocationChart.tsx`), pas kebab-case — CLAUDE.md mis à jour en conséquence

## Variables d'environnement
- [S15] Vérifier la cohérence des noms d'env vars entre toutes les routes — une route qui utilise `GEMINI_API_KEY` alors que la clé réelle est `GOOGLE_AI_API_KEY` provoque un 500 silencieux. Grep le nom de variable avant d'ajouter une nouvelle route IA.

## APIs externes
- [S7] Finnhub plan gratuit = US uniquement (403 sur .PA, .MI…) → Yahoo Finance sans clé couvre tout (US + EU + crypto)
- [S7] Yahoo Finance chart API : `meta.isin` présent sur certains actifs EU, absent sur US — ne pas supposer sa présence
- [S7] Crypto sur Yahoo Finance : format `BTC-EUR` ou `BTC-USD` (pas `bitcoin` comme CoinGecko)
