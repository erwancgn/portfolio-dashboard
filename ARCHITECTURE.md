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

## 8. Agents IA — modèles choisis et pourquoi

| Agent | Modèle | Raison |
|---|---|---|
| Surveillance | Claude Haiku | Tâche simple + répétitive → moins cher |
| Newsletter | Claude Sonnet | Rédaction de qualité nécessaire |
| Chat (V1.5) | Claude Sonnet | Raisonnement complexe sur le portfolio |

**Budget estimé :** ~7€/mois
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

*Dernière mise à jour : Session 7 — 23/03/2026*