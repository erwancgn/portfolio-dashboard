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

## 4. Pourquoi séparer les appels API côté serveur ?

**Problème :** Les APIs externes (Finnhub, CoinGecko) bloquent les appels
depuis un navigateur (politique CORS).

**Solution :** Toutes les API Routes Next.js (`src/app/api/*`) s'exécutent
côté serveur. Le navigateur appelle notre serveur, notre serveur appelle Finnhub.
```
Navigateur → /api/quote?ticker=NVDA → Serveur Next.js → Finnhub API
                                    ← { price: 142.5 } ←
```

**Règle absolue :** jamais de `NEXT_PUBLIC_` sur une clé secrète.

---

## 5. Gestion des devises

**Problème :** Finnhub retourne les prix dans la devise native (NVDA → USD, Toyota → JPY).
Trade Republic affiche tout en EUR.

**Solution :** API Frankfurter (open source, BCE, sans clé) à chaque refresh.
```
NVDA prix = 142.5 USD × taux EUR/USD → 131.2 EUR
```

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
Toutes les routes `/api/*` ont un rate limiter pour éviter :
- L'épuisement du quota Finnhub (60 req/min)
- La dérive de coût IA

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

## 11. Style — Tailwind v4 + CSS variables

**Choix :** Tailwind v4 sans `tailwind.config.ts` — configuration dans `globals.css`.

**Règle :**
- Tailwind pour le layout et l'espacement (`flex`, `gap-4`, `rounded-xl`...)
- CSS variables pour les couleurs du thème (`var(--color-accent)`)
- Jamais de style inline `style={{}}` dans les composants

---

## 12. Server Components vs Client Components

**Règle :**
- Pages = Server Components par défaut (meilleure performance, accès direct à Supabase)
- `'use client'` uniquement si interaction utilisateur requise (boutons, formulaires, état)
- Isoler les parties interactives dans des composants dédiés (ex: `LogoutButton.tsx`)

---

*Dernière mise à jour : Session 4 — 18/03/2026*