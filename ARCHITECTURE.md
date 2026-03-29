# 🏗️ Architecture — Portfolio Dashboard IA

> Ce fichier documente les décisions techniques importantes.
> Pour chaque décision : ce qu'on a choisi, pourquoi, et quelle était l'alternative.

---

## 1. Pourquoi Next.js plutôt que Python ?

**Choix : Next.js 16 + React 19 (TypeScript)**

| Critère | Next.js | Python (FastAPI) |
|---|---|---|
| Stack unique | ✅ Frontend + Backend dans 1 repo | ❌ 2 repos à maintenir |
| Déploiement | ✅ Vercel gratuit en 1 clic | ❌ Railway ~5-10€/mois |
| Agents IA | ✅ Vercel AI SDK natif | ✅ LangChain natif |
| Librairies finance | ⚠️ Limitées en JS | ✅ Pandas, NumPy |
| Courbe apprentissage | ✅ 1 langage (TypeScript) | ❌ 2 langages |

**Décision :** Next.js 16 pour le MVP. Next.js 14 initialement ciblé mais incompatible
avec React 19. Python envisagé en V2 comme microservice d'analyse quantitative si besoin.

---

## 2. Pourquoi Supabase plutôt que Firebase ?

**Choix : Supabase (PostgreSQL)**

| Critère | Supabase | Firebase |
|---|---|---|
| Base de données | ✅ PostgreSQL standard | ❌ NoSQL propriétaire |
| Exportabilité | ✅ SQL standard, migrable | ❌ Vendor lock-in fort |
| Row Level Security | ✅ Natif PostgreSQL | ⚠️ Rules complexes |
| Prix | ✅ Gratuit jusqu'à 500MB | ⚠️ Peut dériver |
| Auth intégrée | ✅ Email + OAuth | ✅ Email + OAuth |

**Décision :** Supabase. PostgreSQL standard = migrable vers n'importe quel hébergeur.

---

## 3. Pourquoi Vercel Hobby d'abord ?

**Choix : Vercel Hobby (gratuit) → Pro quand les agents sont prêts**

Les Cron Jobs sont limités à 1x/jour sur Hobby. Suffisant pour le MVP.
On passe en Pro (~20$/mois) uniquement quand l'Agent Surveillance sera développé (V1.5).

**Règle :** ne pas payer pour une fonctionnalité qui n'existe pas encore.

---

## 4. Sources de données de marché — Yahoo Finance

**Choix : Yahoo Finance (non officiel, sans clé) pour prix et recherche**

| Critère | Yahoo Finance | Finnhub (gratuit) |
|---|---|---|
| Couverture | ✅ Mondial (US + EU + crypto) | ❌ US uniquement |
| Clé API | ✅ Aucune | ❌ Requise |
| ETF européens | ✅ CW8.PA, EWLD.PA… | ❌ 403 Forbidden |
| Fiabilité | ⚠️ API non officielle | ✅ API officielle |
| Crypto | ✅ BTC-EUR, ETH-USD… | ❌ Plan gratuit limité |

**Décision S7 :** Migration complète vers Yahoo Finance. Finnhub plan gratuit retourne
403 sur tous les actifs européens — inutilisable pour un portfolio français.
`FINNHUB_API_KEY` supprimée du `.env.local`.

**Architecture :**
```
Navigateur → /api/quote?ticker=CW8.PA → Serveur Next.js → Yahoo Finance
                                       ← { price: 598€, currency: EUR } ←
```

**Règle absolue :** jamais de `NEXT_PUBLIC_` sur une clé secrète.

---

## 5. Gestion des devises

**Problème :** Yahoo Finance retourne les prix dans la devise native (NVDA → USD, MC.PA → EUR).
Le dashboard affiche tout en EUR.

**Solution :** API Frankfurter (open source, BCE, sans clé) pour les conversions.
```
NVDA prix = 177.5 USD × taux USD/EUR (Frankfurter) → 163.2 EUR
BNP.PA   = 74.2 EUR → pas de conversion
BTC-EUR  = 71000 EUR → pas de conversion
```

**Devises gérées :** EUR (direct), USD (Frankfurter), GBp/GBP (Frankfurter ÷100 pour les pence).

---

## 6. Sécurité des données

**Row Level Security (RLS) Supabase :**
Chaque table a une policy `auth.uid() = user_id`.
Chaque user ne voit que ses propres données.

**Variables d'environnement :**
- Clés secrètes → `.env.local` (jamais committé)
- Clés publiques → `NEXT_PUBLIC_` (uniquement Supabase URL et anon key)
- En production → variables Vercel Dashboard uniquement

**Rate limiting :**
Routes `/api/*` sans authentification publique — la sécurité repose sur :
- RLS Supabase (données utilisateur inaccessibles sans session)
- Pas de quota à gérer côté Yahoo Finance (API non officielle, sans clé)

---

## 7. Calcul du PRU (Prix de Revient Unitaire)
```
nouveau_pru = (ancienne_quantité × ancien_pru + montant_investi)
              ÷ (ancienne_quantité + quantité_achetée)
```

**Exemple :**
```
Position existante : 10 titres @ 100€ = 1000€ investis
Achat DCA          : 200€ @ 95€ = 2.1 titres
Nouveau PRU        : (1000 + 200) / (10 + 2.1) = 99.17€
```

---

## 8. Agents IA — modèles et architecture [S13]

**Architecture prévue :** API Claude intégrée dans Next.js API Routes, contexte portfolio injecté (positions, P&L, allocation, historique).

| Fonctionnalité | Modèle | Raison | Ticket |
|---|---|---|---|
| Chat IA portfolio | Claude Sonnet | Raisonnement sur données financières complexes, bon ratio coût/qualité | #57 |
| Analyse titre — Quick | Claude Haiku | Résumé 3 lignes + signal HOLD/BUY/SELL — rapide et peu coûteux | #58 |
| Analyse titre — Standard | Claude Sonnet | Analyse technique + fondamentale + risques — qualité intermédiaire | #58 |
| Analyse titre — Full | Claude Opus | Analyse institutionnelle complète + scénarios — qualité maximale | #58 |

**Pourquoi 3 niveaux d'analyse :** Le coût par requête varie de x1 (Haiku) à x30 (Opus). L'utilisateur choisit la profondeur selon son besoin — quick pour un survol, full pour une décision d'investissement.

**Budget estimé :** ~7€/mois (usage solo, majorité Haiku/Sonnet)
**Garde-fou :** Spending limit 20€/mois sur dashboard Anthropic

---

## 9. Historique des erreurs majeures

| Session | Erreur | Impact | Solution |
|---|---|---|---|
| 1 | Licence Xcode non acceptée | Blocage nvm | `sudo xcodebuild -license` |
| 2 | `uuid_generate_v4()` inexistante | Migration SQL bloquée | Remplacer par `gen_random_uuid()` |
| 2 | `node_modules` corrompus | Next.js ne démarrait pas | `rm -rf node_modules && npm install` |
| 3 | Dossier `app/` racine en conflit | 404 sur toutes les routes | `rm -rf app/` |
| 3 | UTF-8 invalide dans tsx | Build error | Toujours écrire le contenu via Cursor, pas `cat >` |
| 3 | `middleware.ts` déprécié | Warning Next.js 16 | Renommer en `proxy.ts` + fonction `proxy()` |

---

## 10. Gestion du schéma de base de données

**Règle absolue :** `src/types/database.ts` est toujours généré automatiquement.
Ne jamais modifier ce fichier manuellement.

**Workflow d'évolution du schéma :**
1. Créer un fichier dans `supabase/migrations/` (nommage : `YYYYMMDDHHMMSS_description.sql`)
2. Écrire le SQL de modification
3. Appliquer : `supabase db push`
4. Regénérer les types : `supabase gen types typescript --local > src/types/database.ts`
5. Commiter les deux fichiers ensemble

---

## 11. Typage des actifs — enum `asset_type`

**Décision :** utiliser un enum PostgreSQL plutôt qu'un `TEXT` avec `CHECK` constraint.

**Valeurs :** `'stock'` | `'etf'` | `'crypto'`

**Raison du choix :**
- Contrainte d'intégrité forte au niveau DB (impossible d'insérer une valeur hors enum)
- Le type TypeScript `"stock" | "etf" | "crypto"` est généré automatiquement par `supabase gen types`
- Plus explicite qu'un `sector` détourné de sa sémantique

**Migration :** `supabase/migrations/20260323000000_add_asset_type_to_positions.sql`

**Workflow pour ajouter une valeur à l'enum :**
```sql
ALTER TYPE asset_type ADD VALUE 'reit';  -- ne nécessite pas de recreate
```
Puis regénérer les types : `supabase gen types typescript --local > src/types/database.ts`

---

## 12. Style — Tailwind v4 + CSS variables

**Choix :** Tailwind v4 sans `tailwind.config.ts` — configuration dans `globals.css`.

**Règle :**
- Tailwind pour le layout et l'espacement (`flex`, `gap-4`, `rounded-xl`...)
- CSS variables pour les couleurs du thème (`var(--color-accent)`)
- Jamais de style inline `style={{}}` dans les composants

---

## 13. Server Components vs Client Components

**Règle :**
- Pages = Server Components par défaut (meilleure performance, accès direct à Supabase)
- `'use client'` uniquement si interaction utilisateur requise (boutons, formulaires, état)
- Isoler les parties interactives dans des composants dédiés (ex: `LogoutButton.tsx`)

---

## 14. Server Components — requêtes Supabase directes

**Règle :** Un Server Component ne doit JAMAIS appeler ses propres API Routes via `fetch`.

**Problème rencontré (S7) :** `PositionsTable` appelait `/api/positions` via HTTP.
Les cookies de session ne sont pas transmis dans un `fetch` interne → Supabase retourne
"non authentifié" → tableau vide silencieux.

**Solution :** Importer `createClient()` directement dans le Server Component et
requêter Supabase sans passer par HTTP. Les cookies sont transmis automatiquement.

```typescript
// ❌ NE PAS FAIRE
const res = await fetch(`${baseUrl}/api/positions`)

// ✅ FAIRE
const supabase = await createClient()
const { data } = await supabase.from('positions').select('*')
```

---

## 15. Déduplication des appels réseau — React cache() [S8]

**Problème :** Plusieurs Server Components appelant `fetchQuote()` dans le même rendu
déclenchent plusieurs requêtes Yahoo Finance identiques.

**Solution :** `cache()` de React 19 dans `src/lib/quote.ts`.
La fonction n'est exécutée qu'une fois par cycle de rendu, le résultat est partagé.

```typescript
export const fetchQuote = cache(async function fetchQuote(ticker) { ... })
```

---

## 16. Transactions atomiques — RPCs PostgreSQL [S11]

**Problème :** Un achat ou une vente touche plusieurs tables (positions + transactions).
Si une requête échoue à mi-chemin, la DB est dans un état incohérent.

**Solution :** RPCs PostgreSQL (`buy_position`, `sell_position`, `deposit_liquidity`)
encapsulant chaque opération dans une transaction SQL complète.

**Avantage :** Le serveur Next.js appelle un seul RPC → atomicité garantie par PostgreSQL.

---

## 17. UI/UX — Thème light + shadcn/ui [S11]

**Décision :** Thème light blanc/noir/bleu inspiré de Trade Republic et Moning.
Variables CSS dans `globals.css` (`--color-bg-primary`, `--color-accent`…).
shadcn/ui pour les composants Dialog, Sheet, Table — compatibles Tailwind v4.

**Règle :** CSS variables pour les couleurs, Tailwind pour layout/espacement, jamais de `style={{}}`.

---

## 18. Fiscalité — Flat tax 30% [S11]

**Implémentation :** Taxe calculée à la vente selon l'enveloppe :
- PEA → 0% (exonéré)
- CTO / Crypto → 30% (flat tax française)

La taxe s'applique uniquement sur la **plus-value** (gain réalisé).
Stockée dans la table `transactions` comme colonne `tax_amount`.

---

## 19. Enrichissement ISIN/Secteur [S12]

**Problème :** Yahoo Finance retourne l'ISIN seulement sur certains actifs EU.
Le secteur est absent pour les ETF via `summaryProfile`.

**Architecture en cascade :**
1. DB d'abord — si ticker connu avec ISIN → réutilisation immédiate
2. Yahoo `/chart` — prix + `meta.isin` (quand disponible)
3. Yahoo `/quoteSummary` — `summaryProfile.sector` (actions) ou `topHoldings.sectorWeightings` (ETF)
4. Saisie manuelle — toujours possible en fallback

**Note :** OpenFIGI évalué mais ne retourne pas les ISIN directement — écarté.

---

## 20. Sources de données enrichies — Architecture hybride FMP + Yahoo [S13]

**Problème :** Yahoo Finance `quoteSummary` exige désormais un crumb (cookie CSRF)
pour retourner secteur, description et ISIN. API non officielle fragile.

**Solution :** Séparation claire enrichissement / prix live.

| Rôle | API | Fréquence | Limite |
|---|---|---|---|
| Logo, secteur, ISIN, description, pays | FMP `/api/v3/profile/{ticker}` | 1 fois à l'ajout, cache DB | 250 req/jour (free) |
| Prix live (US + EU + crypto) | Yahoo Finance `/chart` | Polling 60s | Aucune |
| Devises | Frankfurter | À chaque refresh | Aucune |

**Pourquoi pas FMP pour les prix :**
FMP gratuit = 250 req/jour. Polling 60s × 20 positions = ~28 800 req/jour.
Yahoo `/chart` (sans crumb, sans clé) reste supérieur pour les prix live EU.

**Alternatives considérées :**
- Fix crumb Yahoo seul : scraping CSRF fragile, pas de logo, risque de re-casser. Écarté.
- Polygon.io : US uniquement. Écarté.
- Alpha Vantage : 25 req/jour, couverture EU faible. Écarté.
- Twelve Data : pas de logo, 800 req/jour. Écarté.

**Variable d'environnement :** `FMP_API_KEY` (serveur uniquement, jamais `NEXT_PUBLIC_`)

**Architecture en cascade à l'ajout de position :**
1. DB — si ticker connu avec données enrichies → réutilisation immédiate
2. FMP `/profile/{ticker}` → logo, secteur, ISIN, description, pays
3. Fallback saisie manuelle si FMP ne retourne rien

*Dernière mise à jour : Session 13 — 29/03/2026*