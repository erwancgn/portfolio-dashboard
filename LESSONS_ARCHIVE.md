# LESSONS_ARCHIVE.md — Leçons archivées (Sessions 1-3)

> Archivé depuis LESSONS.md pour garder le fichier actif sous 50 lignes.
> Ces leçons restent valables mais sont moins susceptibles de se reproduire.

---

## TypeScript / Code [S1-S3]
- [S3] `cat >` dans le terminal corrompt l'UTF-8 → toujours écrire via l'éditeur, `touch` uniquement pour créer les fichiers vides
- [S3] Alias `@/*` pointait vers `./` au lieu de `./src/*` → si erreur d'import, vérifier `tsconfig.json` paths en premier
- [S3] Fichiers non sauvegardés = 404 persistant → toujours `Cmd+S` sur tous les fichiers avant de tester

## Supabase / DB [S1-S3]
- [S2] `uuid_generate_v4()` n'existe pas en PostgreSQL moderne → utiliser `gen_random_uuid()` partout
- [S2] `supabase db push` n'exécute pas toujours les migrations → utiliser `supabase db reset` en local pour tout réappliquer
- [S2] Les types DB doivent être regénérés après chaque migration → `supabase gen types typescript --local > src/types/database.ts`

## Next.js [S1-S3]
- [S3] `middleware.ts` est déprécié en Next.js 16 → utiliser `proxy.ts` avec la fonction `proxy()`
- [S3] Dossier `app/` à la racine entre en conflit avec `src/app/` → ne jamais créer de dossier `app/` à la racine
- [S3] Next.js 14 est incompatible avec React 19 → rester sur Next.js 16

## Git / Process [S1-S2]
- [S1] `git add` avant `Cmd+S` = fichiers vides commités → toujours sauvegarder avant de stage
- [S2] Les automatisations GitHub Board ferment les issues à l'import → vérifier le board après chaque manipulation

## Environnement [S1-S3]
- [S1] Licence Xcode non acceptée bloque nvm → `sudo xcodebuild -license` si blocage
- [S1] `node_modules` corrompus après copie manuelle → toujours `rm -rf node_modules && npm install`, jamais `cp -r`
- [S3] Cursor ne reconnaît pas `@theme` Tailwind v4 → warning ignorable, fonctionne à l'exécution
