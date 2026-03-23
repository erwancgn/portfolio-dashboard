# LESSONS.md — Règles apprises des sessions passées

> Lu par les agents en début de chaque session.
> Chaque leçon = une erreur réelle → une règle concrète.
> Format : [SX] contexte → règle
> Plafonner à ~100 lignes. Si dépassé, archiver les plus anciennes.

---

## TypeScript / Code
- [S3] `cat >` dans le terminal corrompt l'UTF-8 → toujours écrire via l'éditeur, `touch` uniquement pour créer les fichiers vides
- [S3] Alias `@/*` pointait vers `./` au lieu de `./src/*` → si erreur d'import, vérifier `tsconfig.json` paths en premier
- [S3] Fichiers non sauvegardés = 404 persistant → toujours `Cmd+S` sur tous les fichiers avant de tester

## Supabase / DB
- [S2] `uuid_generate_v4()` n'existe pas en PostgreSQL moderne → utiliser `gen_random_uuid()` partout
- [S2] `supabase db push` n'exécute pas toujours les migrations → utiliser `supabase db reset` en local pour tout réappliquer
- [S2] Les types DB doivent être regénérés après chaque migration → `supabase gen types typescript --local > src/types/database.ts`

## Next.js
- [S3] `middleware.ts` est déprécié en Next.js 16 → utiliser `proxy.ts` avec la fonction `proxy()`
- [S3] Dossier `app/` à la racine entre en conflit avec `src/app/` → ne jamais créer de dossier `app/` à la racine
- [S3] Next.js 14 est incompatible avec React 19 → rester sur Next.js 16
- [S5] `next lint` et `npm run lint` sont supprimés en Next.js 16 → utiliser `npx eslint src --ext .ts,.tsx` dans les pré-checks

## Skills Vercel
- [S5] `npx skills add vercel-labs/agent-skills@react-best-practices` échoue → le skill s'appelle `vercel-react-best-practices`, vérifier les noms exacts avec `npx skills list` d'abord

## React / Composants
- [S6] `setState` synchrone dans le corps d'un `useEffect` déclenche l'erreur ESLint `react-hooks/set-state-in-effect` → mettre les setState soit dans `handleChange`, soit à l'intérieur du callback async (setTimeout/fetch)
- [S6] Un Server Component ne peut pas avoir d'état interactif (tri par colonne, filtres) → anticiper un wrapper Client Component dès qu'une UI nécessite de l'interactivité

## Supabase / DB
- [S6] `supabase gen types` peut injecter du texte de debug (`Connecting to db 5432`) en ligne 1 → toujours vérifier et nettoyer la ligne 1 de `database.ts` après régénération

## Git / Process
- [S1] `git add` avant `Cmd+S` = fichiers vides commités → toujours sauvegarder avant de stage
- [S2] Les automatisations GitHub Board ferment les issues à l'import → vérifier le board après chaque manipulation

## Environnement
- [S1] Licence Xcode non acceptée bloque nvm → `sudo xcodebuild -license` si blocage
- [S1] `node_modules` corrompus après copie manuelle → toujours `rm -rf node_modules && npm install`, jamais `cp -r`
- [S3] Cursor ne reconnaît pas `@theme` Tailwind v4 → warning ignorable, fonctionne à l'exécution
