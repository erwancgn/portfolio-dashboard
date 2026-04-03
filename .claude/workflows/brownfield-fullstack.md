# Workflow — Brownfield Fullstack (Portfolio Dashboard)

## Quand utiliser
Ce workflow s'applique à toute nouvelle feature ou changement structurant sur le projet existant.

## Séquence

### Phase 1 : Analyse
- **Agent** : analyst
- **Input** : besoin exprimé par le PO
- **Output** : project brief (`.claude/templates/project-brief.md`)
- **Gate** : PO valide le brief

### Phase 2 : Planification
- **Agent** : pm
- **Input** : project brief validé
- **Output** : PRD + epics (`.claude/templates/prd.md`, `.claude/templates/epic.md`)
- **Gate** : PO valide le PRD

### Phase 3 : Architecture
- **Agent** : architect
- **Input** : PRD validé
- **Output** : ADR si décision structurante (`.claude/templates/architecture-decision.md`)
- **Gate** : checklist `.claude/checklists/architecture-review.md`
- **Skip si** : changement simple sans impact archi

### Phase 4 : Stories
- **Agent** : sm
- **Input** : PRD + ADR
- **Output** : stories implémentables (`.claude/templates/story.md`) + tickets GitHub
- **Gate** : checklist `.claude/checklists/story-draft.md` pour chaque story

### Phase 5 : Implémentation
- **Agent** : dev-agent (worktree isolé)
- **Input** : story avec fichiers et AC listés
- **Skill** : `dev-workflow`
- **Output** : code implémenté
- **Boucle** : une story à la fois

### Phase 6 : Review
- **Agent** : code-reviewer
- **Input** : diff du dev-agent
- **Gate** : checklist `.claude/checklists/pre-commit.md`
- **Si ❌** : retour au dev-agent pour correction

### Phase 7 : QA
- **Agent** : test-agent
- **Skill** : `test-workflow`
- **Input** : code reviewé
- **Gate** : checklist `.claude/checklists/story-dod.md`
- **Si ❌** : retour au dev-agent

### Phase 8 : Validation
- **Agent** : aucun (PO humain)
- **Action** : PO valide → commit → merge

## Raccourcis
- **Bug simple** (cause évidente, 1-2 fichiers) : skip phases 1-4, directement dev → review → QA
- **Typo / config** : skip tout, fix direct
- **UI/UX** : ajouter ux-agent en phase 5 ou avant
