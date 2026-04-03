# Conventions de code

## Nommage

- Variables et fonctions : camelCase (ex: `portfolioValue`, `fetchQuote`)
- Composants React : PascalCase (ex: `AllocationChart`, `PositionRow`)
- Fichiers composants : PascalCase (ex: `AllocationChart.tsx`, `PositionRow.tsx`)
- Fichiers non-composants : kebab-case (ex: `format.ts`, `quote.ts`, `use-portfolio.ts`)

## Documentation

- Commentaires JSDoc obligatoires sur toutes les fonctions dans `src/lib/`
- Inclure `@param`, `@returns`, et une description courte

## Commits

Format conventionnel obligatoire :
- `feat:` nouvelle fonctionnalité
- `fix:` correction de bug
- `docs:` documentation uniquement
- `chore:` maintenance, config, dépendances
- `test:` ajout ou correction de tests

Inclure le numéro de ticket quand applicable : `fix(#74): description`

## Longueur de fichier

- Maximum 200 lignes par fichier — diviser en modules si dépassé
- Exception : `src/types/database.ts` est généré automatiquement via `npx supabase gen types typescript --local` — ne jamais modifier manuellement

## Style inline

`style={{}}` toléré **uniquement** pour les valeurs CSS calculées dynamiquement inexprimables en Tailwind pur :
- `width: X%` pour une barre de progression
- `fill=` pour SVG/Recharts
- Toute autre valeur numérique calculée au runtime

Dans tous les autres cas, utiliser Tailwind.
