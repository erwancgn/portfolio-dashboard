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

## APIs externes
- [S7] Finnhub plan gratuit = US uniquement (403 sur .PA, .MI…) → Yahoo Finance sans clé couvre tout (US + EU + crypto)
- [S7] Yahoo Finance chart API : `meta.isin` présent sur certains actifs EU, absent sur US — ne pas supposer sa présence
- [S7] Crypto sur Yahoo Finance : format `BTC-EUR` ou `BTC-USD` (pas `bitcoin` comme CoinGecko)
