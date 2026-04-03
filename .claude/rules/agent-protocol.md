# Protocole agents et économie de tokens

## Comportement des agents

- Les agents modifient les fichiers directement sans demander permission — expliquer après, validation PO en fin de tâche
- Toujours lire un fichier avant de le modifier — jamais de réécriture complète sans lecture
- Modifications ciblées et vérifiées uniquement
- Travailler tâche par tâche selon le backlog GitHub
- Si une décision d'architecture est nécessaire → stopper et demander au PO

## Workflow BMAD

PO exprime un besoin → [analyst] comprend et produit un brief → [pm] transforme en PRD / epics → [architect] valide l'approche technique → [sm] découpe en stories → [dev-agent] implémente (worktree isolé) → [code-reviewer] review pre-commit → [test-agent] vérifie AC + régressions → PO valide → commit

## Choix du modèle (TOUJOURS EN PREMIER)

- **Tâche simple** (1-2 fichiers, bug évident, typo) → Haiku 4.5 (10× moins cher)
- **Tâche standard** (feature 3-5 fichiers, refactor ciblé) → Sonnet 4.6 (défaut)
- **Tâche complexe** (architecture, multi-système, décisions majeures) → Opus 4.6
- **IA/Prompts** (agents, évals, skill creation) → Opus 4.6 (qualité critique)

## Lecture chirurgicale des fichiers

- `DEVLOG.md` → lire uniquement les 50 dernières lignes (offset ciblé) — jamais le fichier entier
- `CHANGELOG.md` → ne pas relire si le format est connu — écrire directement
- Fichier de bug → lire uniquement le fichier concerné, pas les composants adjacents
- Utiliser `Grep` pour localiser une section avant de lire avec `offset/limit`

## Plan mode — seuil strict

- **Oui** : tâche 3+ étapes, décision d'architecture, migration DB, refacto multi-fichiers
- **Non** : bug évident 1-2 lignes, renommage, correction typo, ajout d'entrée dans un fichier de config
- Un bug avec cause claire → fix direct, expliquer après. Pas de plan mode.

## Tableau des agents spécialisés

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

## Self-improvement loop

- Après toute correction du PO (technique ou process) → ajouter une règle dans `LESSONS.md` immédiatement
- Format : `[SX] contexte → règle concrète`
- Ne pas attendre la fin de session pour capitaliser
