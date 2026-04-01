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
- Toujours lire le fichier concerné avant de modifier
- Jamais de réécriture complète sans avoir lu l'original
- Effectuer uniquement des modifications ciblées et vérifiées
- Ne jamais modifier du code sans l'avoir vérifié contre le contexte existant
- **Les agents modifient les fichiers directement sans demander permission** — expliquer après, validation PO en fin de tâche

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

### Environnements
- Dev : `localhost:3000` — Supabase Docker local — bandeau orange
- Prod : Vercel — `git push main` suffit

### Base de données
- Ne jamais modifier la base de données de production
- Toujours travailler sur l'environnement local (Docker + Supabase CLI)
- Ne jamais exécuter de migrations sans validation PO

### Périmètre
- Travailler tâche par tâche selon le backlog GitHub
- Si une décision d'architecture est nécessaire, stopper et demander au PO

---

## Workflow obligatoire
1. Lire SESSION.md — contexte et tickets de la session en cours
2. Plan mode pour toute tâche non trivial et vérifie plan avant de commencer
3. Identifier la tâche précise et les fichiers associés
4. **Modifier les fichiers directement** — pas besoin de demander permission pour éditer le code
5. Corrige si ca ne passe pas, aide toi des logs, erreurs, presente seulement du travail fonctionnel
6. Marque les items complets au fur et a mesure (plan, lesson.md, github)
7. Expliquer ce qui a été fait et pourquoi — la validation PO après explication suffit
8. Attendre la validation PO avant tout commit
9. Si valide : commit et compact ou clear le context

---

## Économie de tokens — règles strictes

### Lire les fichiers de façon chirurgicale
- `DEVLOG.md` → lire uniquement les 50 dernières lignes (`offset` ciblé) — jamais le fichier entier
- `CHANGELOG.md` → ne pas relire si le format est connu — écrire directement
- Fichier de bug → lire uniquement le fichier concerné, pas les composants adjacents
- Utiliser `Grep` pour localiser une section avant de lire avec `offset/limit`

### Plan mode — seuil strict
- **Oui** : tâche 3+ étapes, décision d'architecture, migration DB, refacto multi-fichiers
- **Non** : bug évident 1–2 lignes, renommage, correction typo, ajout d'entrée dans un fichier de config
- Un bug avec cause claire → fix direct, expliquer après. Pas de plan mode.

### Subagents — garder le contexte principal propre
- Exploration codebase multi-fichiers → agent `Explore` (isole les résultats dans un sous-contexte)
- Implémentation feature complète → agent `dev-agent`
- Ne pas lire 3+ fichiers de doc en parallèle dans le contexte principal si un agent peut le faire

### Self-improvement loop
- Après toute correction du PO (technique ou process) → ajouter une règle dans `LESSONS.md` immédiatement
- Format : `[SX] contexte → règle concrète`
- Ne pas attendre la fin de session pour capitaliser

---

## Conventions de code

- Nommage : camelCase variables, PascalCase composants, **PascalCase fichiers composants** (ex: `AllocationChart.tsx`), kebab-case fichiers non-composants (ex: `format.ts`, `quote.ts`)
- Commentaires JSDoc sur toutes les fonctions dans `src/lib/`
- Commits : format conventionnel (feat:, fix:, docs:, chore:, test:)
- Longueur fichier : max 200 lignes — diviser si dépassé (exception : `src/types/database.ts` est généré automatiquement via `npx supabase gen types typescript --local`)
- `style={{}}` toléré **uniquement** pour les valeurs CSS calculées dynamiquement inexprima bles en Tailwind pur (ex: `width: X%` pour une barre de progression, `fill=` pour SVG/Recharts)

---

## Documentation obligatoire

Après chaque tâche complétée, mettre à jour :
- `DEVLOG.md` → ce qui a été fait, erreurs rencontrées, solutions
- `CHANGELOG.md` → si une fonctionnalité est livrée
- `ARCHITECTURE.md` → si une décision technique a été prise

Avant chaque fin de session, commit, push, mettre à jour : 
- `SESSION.md` → indiqué ce qui a été fait, et préparer la prochaine session
- `DEVLOG.md` → ce qui a été fait, erreurs rencontrées, solutions
- `CHANGELOG.md` → si une fonctionnalité est livrée
- `ARCHITECTURE.md` → si une décision technique a été prise
