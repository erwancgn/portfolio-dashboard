# CLAUDE.md — Instructions pour Claude Code

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Ces règles sont non-négociables.

---

## Identité du projet

Portfolio Dashboard IA — application Next.js 16 + React 19 de suivi de portfolio financier personnel.
Stack : Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Vercel

---

## Règles absolues — ne jamais enfreindre

### Code
- Toujours lire le fichier concerné avant de proposer du code
- Jamais de réécriture complète sans avoir lu l'original
- Proposer uniquement des modifications ciblées et vérifiées
- Ne jamais proposer du code qui n'a pas été vérifié contre le contexte existant

### Style
- Tailwind CSS pour le layout et l'espacement
- CSS variables (`var(--color-*)`) uniquement pour les couleurs du thème
- Jamais de style inline `style={{}}` dans les composants

### Sécurité
- Ne jamais lire, afficher ou utiliser le contenu de `.env.local`
- Ne jamais accéder aux credentials de production
- Ne jamais exposer une clé API dans le code côté client
- Toutes les clés secrètes restent dans les variables d'environnement serveur uniquement

### Git
- Ne jamais faire `git push` de façon autonome
- Ne jamais commiter sans validation explicite du PO
- Chaque commit doit être validé et compris par le PO avant d'être exécuté

### Base de données
- Ne jamais modifier la base de données de production
- Toujours travailler sur l'environnement local (Docker + Supabase CLI)
- Ne jamais exécuter de migrations sans validation PO

### Périmètre
- Travailler tâche par tâche selon le backlog GitHub
- Ne jamais dépasser le périmètre de la tâche demandée
- Si une décision d'architecture est nécessaire, stopper et demander au PO

---

## Workflow obligatoire
```
1. Lire le DEVLOG.md — section "Prochaine session"
2. Lire les fichiers concernés par la tâche avant de proposer du code
3. Identifier la tâche précise dans le backlog
4. Générer uniquement les modifications nécessaires
5. Expliquer ce qui a été fait et pourquoi
6. Attendre la validation PO avant tout commit
```

---

## Architecture — rappels clés

- App Router Next.js 16 — pas de Pages Router
- `proxy.ts` au lieu de `middleware.ts` (convention Next.js 16)
- TypeScript strict — pas de `any`
- Appels API externes (Finnhub, CoinGecko) → uniquement dans `src/app/api/*`
- Jamais de `NEXT_PUBLIC_` sur une clé secrète
- RLS Supabase activé sur toutes les tables
- Server Components pour les pages — Client Components uniquement si interaction utilisateur requise

---

## Calculs financiers — formules de référence
```
Valeur position    = quantité × prix_actuel
Valeur investie    = quantité × pru
P&L                = valeur_position - valeur_investie
P&L %              = (P&L / valeur_investie) × 100
Poids %            = (valeur_position / valeur_totale) × 100

Nouveau PRU (DCA)  = (ancienne_quantité × ancien_pru + montant)
                     / (ancienne_quantité + quantité_achetée)
```

---

## Conventions de code

- Nommage : camelCase variables, PascalCase composants, kebab-case fichiers
- Commentaires JSDoc sur toutes les fonctions dans `src/lib/`
- Commits : format conventionnel (feat:, fix:, docs:, chore:, test:)
- Longueur fichier : max 200 lignes — diviser si dépassé

---

## Documentation obligatoire

Après chaque tâche complétée, mettre à jour :
- `DEVLOG.md` → ce qui a été fait, erreurs rencontrées, solutions
- `CHANGELOG.md` → si une fonctionnalité est livrée
- `ARCHITECTURE.md` → si une décision technique a été prise