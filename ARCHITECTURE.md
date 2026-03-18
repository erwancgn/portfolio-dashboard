# 🏗️ Architecture — Portfolio Dashboard IA

> Ce fichier documente les décisions techniques importantes.
> Pour chaque décision : ce qu'on a choisi, pourquoi, et quelle était l'alternative.

---

## 1. Pourquoi Next.js plutôt que Python ?

**Choix : Next.js 14 (TypeScript)**

| Critère | Next.js | Python (FastAPI) |
|---|---|---|
| Stack unique | ✅ Frontend + Backend dans 1 repo | ❌ 2 repos à maintenir |
| Déploiement | ✅ Vercel gratuit en 1 clic | ❌ Railway ~5-10€/mois |
| Agents IA | ✅ Vercel AI SDK natif | ✅ LangChain natif |
| Librairies finance | ⚠️ Limitées en JS | ✅ Pandas, NumPy |
| Courbe apprentissage | ✅ 1 langage (TypeScript) | ❌ 2 langages |

**Décision :** Next.js pour le MVP. Python envisagé en V2 comme microservice
d'analyse quantitative si besoin.

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

**Décision :** Supabase. Le fait que ce soit du PostgreSQL standard signifie
qu'on peut migrer vers n'importe quel autre hébergeur si besoin.

---

## 3. Pourquoi Vercel Hobby d'abord ?

**Choix : Vercel Hobby (gratuit) → Pro quand les agents sont prêts**

Les Cron Jobs (agents IA automatiques) sont limités à 1x/jour sur Hobby.
Suffisant pour le MVP. On passe en Pro (~20$/mois) uniquement quand
l'Agent Surveillance sera développé (V1.5).

**Règle :** ne pas payer pour une fonctionnalité qui n'existe pas encore.

---

## 4. Pourquoi séparer les appels API côté serveur ?

**Problème :** Les APIs externes (Finnhub, CoinGecko) bloquent les appels
depuis un navigateur (politique CORS).

**Solution :** Toutes les API Routes Next.js (`/app/api/*`) s'exécutent
côté serveur. Le navigateur appelle notre serveur, notre serveur appelle
Finnhub. Les clés API ne sont jamais exposées côté client.
```
Navigateur → /api/quote?ticker=NVDA → Serveur Next.js → Finnhub API
                                    ← { price: 142.5 } ←
```

**Règle absolue :** jamais de `NEXT_PUBLIC_` sur une clé secrète.

---

## 5. Gestion des devises

**Problème :** Finnhub retourne les prix dans la devise native du titre
(NVDA → USD, Toyota → JPY). Broker affiche tout en EUR.

**Solution :** API Frankfurter (open source, BCE, sans clé) appelée à
chaque refresh pour convertir tous les prix en EUR.
```
NVDA prix = 142.5 USD × taux EUR/USD → 131.2 EUR
```

---

## 6. Sécurité des données

**Row Level Security (RLS) Supabase :**
Chaque table a une policy qui vérifie `auth.uid() = user_id`.
Même si quelqu'un connaît l'URL de ta base, il ne peut voir
que ses propres données.

**Variables d'environnement :**
- Clés secrètes → `.env.local` (jamais committé)
- Clés publiques → `NEXT_PUBLIC_` (uniquement Supabase URL et anon key)
- En production → variables Vercel Dashboard

**Rate limiting :**
Toutes les routes `/api/*` ont un rate limiter pour éviter :
- L'épuisement du quota Finnhub (60 req/min)
- La dérive de coût IA

---

## 7. Calcul du PRU (Prix de Revient Unitaire)

Le PRU est recalculé à chaque achat (DCA ou ajout de position) :
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

**Budget estimé :** ~7€/mois (détail dans le cahier des charges)
**Garde-fou :** Spending limit 20€/mois sur dashboard Anthropic

---

## 9. Historique des erreurs majeures

| Date | Erreur | Impact | Solution |
|---|---|---|---|
| Session 1 | Licence Xcode non acceptée | Blocage installation nvm | `sudo xcodebuild -license` |

---

## 11. Gestion du schéma de base de données

**Règle absolue :** `src/types/database.ts` est toujours généré automatiquement.
Ne jamais modifier ce fichier manuellement.

**Workflow d'évolution du schéma :**
1. Créer un nouveau fichier dans `supabase/migrations/`
   Nommage : `YYYYMMDDHHMMSS_description.sql`
2. Écrire le SQL de modification (ALTER TABLE, CREATE TABLE, etc.)
3. Appliquer : `supabase db push`
4. Regénérer les types : `supabase gen types typescript --local > src/types/database.ts`
5. Commiter les deux fichiers ensemble

## Décision : Next.js 16 + React 19
Next.js 14 ciblé initialement mais incompatible avec React 19.
Next.js 16 est la version stable actuelle — on reste dessus.

*Dernière mise à jour : Session 3*