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

### Phase 0 : Choix du modèle (TOUJOURS EN PREMIER)
- **Tâche simple** (1-2 fichiers, bug évident, typo) → Haiku 4.5 (10× moins cher)
- **Tâche standard** (feature 3-5 fichiers, refactor ciblé) → Sonnet 4.6 (défaut)
- **Tâche complexe** (architecture, multi-système, décisions majeures) → Opus 4.6
- **IA/Prompts** (agents, évals, skill creation) → Opus 4.6 (qualité critique)

### Phase 1-9 : Implémentation + QA
1. Lire SESSION.md — contexte et tickets de la session en cours
2. Plan mode (tech-lead) pour toute décision d'architecture/design
3. Identifier la tâche précise et les fichiers associés
4. **Exploration multi-fichiers** → déléguer à agent `Explore` (économise tokens)
5. **Implémentation** → déléguer à agent `dev-agent` (isolation contexte)
6. **Design/UX** → appeler agent `ux-agent` si UI/composant concerné
7. **Validation** → appeler agent `test-agent` (acceptance criteria + regressions)
8. Modifier les fichiers directement (pas de demande permission)
9. Corrige si ça ne passe pas (aide toi des logs, erreurs)
10. Marque les items complétés au fur et à mesure
11. Expliquer ce qui a été fait et pourquoi — validation PO après
12. Attendre validation PO avant commit
13. Si valide : commit et `/compact` ou `/clear` le contexte

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

### Subagents — appel obligatoire par spécialité

**Règle d'or** : Un agent spécialisé coûte 5-10% du contexte principal, fait mieux, et remet un rapport résumé.

| Agent | Quand l'appeler | Économies |
|-------|-----------------|-----------|
| **Explore** | Multi-fichiers exploration (3+), patterns search, arch discovery | -20% tokens |
| **dev-agent** | Feature implémentation complète, multi-fichiers changes | -30% tokens |
| **tech-lead** | Décisions architecture, trade-offs techniques, reviews, design patterns | -15% tokens |
| **ux-agent** | UI/UX audit, redesign, composants, Trade Republic/Moning style | -20% tokens |
| **test-agent** | QA vérification, acceptance criteria, regressions, reports | -10% tokens |
| **mentor** | Explication code, onboarding, user understanding | -15% tokens |

**Quand NE PAS appeler** :
- Bug 1-ligne (fix direct) · Typo (fix direct) · Config simple (edit direct)
- Changement trivial local à 1-2 fichiers

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

**WORKFLOW OPTIMISÉ (zéro conflit merge):**

1. **Dans la branche feature :** CODE UNIQUEMENT (pas de doc)
   - Implémenter la tâche
   - Commit code avec message détaillé
   - Ne PAS modifier SESSION.md, DEVLOG.md, etc.

2. **Après merge vers main :** MISE À JOUR DOCUMENTATION
   - SESSION.md → résumé de la tâche, status, tickets complétés
   - DEVLOG.md → contexte, root causes, solutions, erreurs, fichiers modifiés
   - CHANGELOG.md → si fonctionnalité livrée (user-facing)
   - ARCHITECTURE.md → si décision technique majeure

**Raison :** SESSION.md et DEVLOG.md sont des fichiers "consolidation" (une seule source de vérité). Les mettre à jour DANS main (post-merge) évite les conflits et reflète l'état réel du code.

**Exemple correct :**
```
feature branch: git commit fix(#74): Fair Value bugs (code only)
             → git merge → main (no conflicts)
main:        git commit docs: update SESSION/DEVLOG for #74 (post-merge)
             → git push origin main
```
