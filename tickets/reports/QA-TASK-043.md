# Rapport QA — [TASK-043] API Routes prix temps réel (Finnhub + CoinGecko + Frankfurter)
Issue GitHub : #43
Date : 2026-03-20

## Pré-checks
- Build : OK — `npm run build` compile sans erreur ; les deux routes `/api/quote` et `/api/exchange-rate` apparaissent comme routes dynamiques (ƒ) dans le manifeste de build.
- TypeScript : OK — `npx tsc --noEmit` ne produit aucune sortie (zéro erreur).
- Lint : IMPOSSIBLE A EXECUTER — `npm run lint` échoue avec "Invalid project directory provided, no such directory: /Users/ec/portfolio-dashboard/lint". Cause identifiée : Next.js 16 a supprimé la sous-commande `next lint` ; le script dans `package.json` est donc invalide. Ce problème est préexistant au ticket (non introduit par TASK-043) et concerne la configuration du projet.

## Critères d'acceptation

| #   | Critère (depuis le ticket GitHub)                                              | Statut | Détail |
|-----|--------------------------------------------------------------------------------|--------|--------|
| CA1 | GET /api/quote?ticker=AAPL&type=stock retourne un prix en USD                  | OK     | `fetchStockPrice` appelle Finnhub `/quote`, lit `data.c` (prix actuel), retourne `{ ticker, price, currency: 'USD', updatedAt }`. Format de réponse conforme. |
| CA2 | GET /api/quote?ticker=BTC&type=crypto retourne un prix en USD                  | OK     | `fetchCryptoPrice` appelle CoinGecko `/simple/price?ids=btc&vs_currencies=usd`, lit `data[coinId].usd`, retourne `{ ticker, price, currency: 'USD', updatedAt }`. Format conforme. |
| CA3 | GET /api/exchange-rate?from=USD&to=EUR retourne un taux de change              | OK     | `fetchExchangeRate` appelle Frankfurter `/latest?from=USD&to=EUR`, lit `data.rates['EUR']`, retourne `{ from, to, rate, date }`. Cas particulier `from === to` → rate 1 sans appel réseau. |
| CA4 | Aucune clé API exposée côté client                                             | OK     | Les variables `FINNHUB_API_KEY` et `COINGECKO_API_KEY` sont lues via `process.env.FINNHUB_API_KEY` / `process.env.COINGECKO_API_KEY` (serveur uniquement). Aucun préfixe `NEXT_PUBLIC_`. Frankfurter ne requiert pas de clé. |
| CA5 | Erreur 404 si ticker inconnu, 503 si API externe indisponible                  | OK (partiel — voir remarque) | `ApiError` lancée avec `httpStatus: 404` pour ticker/devise inconnu, `httpStatus: 503` pour API down ou quota dépassé. REMARQUE : pour le cas crypto, CoinGecko retourne HTTP 200 avec un objet vide `{}` quand le coin_id est inconnu — la logique `!data[coinId]` couvre correctement ce cas et retourne 404. Pour les actions, Finnhub retourne HTTP 200 avec `c: 0` quand le ticker est inconnu — la condition `!data.c || data.c === 0` couvre ce cas mais présente un faux positif : un actif dont le prix est exactement 0 serait traité comme inconnu (cas extrêmement improbable en pratique). |
| CA6 | Types TypeScript — pas de `any`                                                | OK     | Aucun `any` détecté. Tous les types externes sont modélisés via des interfaces (`FinnhubQuote`, `CoinGeckoPrice`, `FrankfurterResponse`). `tsc --noEmit` confirme. |

## Vérifications spécifiques — API Routes

- Routes dans `src/app/api/*` : OK — `src/app/api/quote/route.ts` et `src/app/api/exchange-rate/route.ts`.
- Clés secrètes côté client : OK — aucune clé secrète exposée. COINGECKO_API_KEY est optionnelle (plan gratuit sans clé) et documentée comme telle dans le code.
- Gestion d'erreur : OK — pattern try/catch avec classe `ApiError` dans les deux routes. Les erreurs réseau inattendues (hors `ApiError`) retournent 503 avec code `INTERNAL_ERROR`. Les paramètres manquants retournent 400 avant tout appel externe.
- Status codes : 200 succès, 400 paramètre manquant/invalide, 404 ticker/devise inconnu, 503 API externe down ou quota dépassé.

## Régression

- `src/lib/supabase/client.ts` : présent, exporte `createClient` (browser).
- `src/lib/supabase/server.ts` : présent, exporte `createClient` (server).
- `src/types/database.ts` : présent.
- `src/proxy.ts` : présent (convention Next.js 16 du projet respectée).
- `/auth/login` : route `src/app/auth/login/page.tsx` présente.
- Build : PASS — aucun des fichiers existants ne casse le build.
- TypeScript : PASS.

## Conventions

- Pas de `any` en TypeScript : OK (vérifié par grep et par tsc).
- Pas de `style={{}}` inline : OK (routes API, pas de JSX).
- Pas de `NEXT_PUBLIC_` sur une clé secrète : OK — seuls Supabase URL et ANON_KEY utilisent `NEXT_PUBLIC_`, ce qui est la norme Supabase.
- Fichiers < 200 lignes : ATTENTION — `src/app/api/quote/route.ts` compte 170 lignes (dans la limite), `src/app/api/exchange-rate/route.ts` compte 135 lignes. Conformes.
- Nommage : OK — fichiers en kebab-case (`route.ts`), interfaces en PascalCase, variables en camelCase.
- JSDoc : OK — les fonctions dans les routes API sont documentées avec des commentaires JSDoc (`@param`, description). Note : la règle JSDoc de CLAUDE.md vise `src/lib/` ; ces fonctions sont dans `src/app/api/` mais sont quand même documentées.
- Commits : non applicable à ce ticket (vérification QA seulement).

## Leçons capturées

[S1] `next lint` (sous-commande) a été supprimée dans Next.js 16 — le script `"lint": "next lint"` dans `package.json` est invalide et échoue avec "Invalid project directory provided". Pour linter un projet Next.js 16, utiliser `eslint src/` directement ou un autre runner ESLint.

## Verdict

PASS avec réserve mineure

Les deux routes API sont créées, correctement structurées, sans exposition de clés, avec gestion d'erreur complète et types stricts. La réserve porte sur CA5 : la détection de ticker inconnu pour Finnhub repose sur `c === 0`, ce qui pourrait théoriquement produire un faux positif 404 pour un actif dont le prix serait exactement zéro (cas non réaliste en production). Le problème de `npm run lint` est préexistant et non introduit par ce ticket.
