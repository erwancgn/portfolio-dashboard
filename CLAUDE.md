# CLAUDE.md — Instructions pour Claude Code

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Ces règles sont non-négociables.

---

## Identité du projet

Portfolio Dashboard IA — application Next.js 14 de suivi de portfolio financier personnel.
Stack : Next.js 14 · TypeScript · Tailwind · Supabase · Vercel

---

## Règles absolues — ne jamais enfreindre

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
1. Lire le DEVLOG.md pour le contexte de la session
2. Identifier la tâche précise dans le backlog
3. Générer le code
4. Expliquer ce qui a été fait et pourquoi
5. Attendre la validation PO avant tout commit
```

---

## Architecture — rappels clés

- App Router Next.js 14 — pas de Pages Router
- TypeScript strict — pas de `any`
- Appels API externes (Finnhub, CoinGecko) → uniquement dans `/app/api/*`
- Jamais de `NEXT_PUBLIC_` sur une clé secrète
- RLS Supabase activé sur toutes les tables

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

---
