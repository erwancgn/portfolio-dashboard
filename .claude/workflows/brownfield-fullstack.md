# Workflow — Brownfield Fullstack (Portfolio Dashboard)

## Principe de routage (TOUJOURS COMMENCER ICI)

```
L'utilisateur exprime un besoin
        │
        ▼
Ticket existe dans .claude/backlog/ ?
   ├─ OUI → FAST-TRACK (80% des cas)
   └─ NON → BMAD complet (nouveau besoin vague)
```

---

## FAST-TRACK — Ticket existant (défaut)

> Utilisé quand un GH-XXX existe déjà avec des CAs définis.
> Ne pas déclencher analyst / pm / sm — le travail de découpage est déjà fait.

```
dev-agent (Builder)
    │
    ├─ Tâche simple (S/M, ≤3 fichiers, pas de DB) → dev → review → QA → PO
    │
    └─ Tâche complexe (L/XL, DB, architecture)
            │
            ▼
        architect (Planner conditionnel)
            │
            ▼
        dev-agent → review → QA → PO
```

**Escalade de dev-agent → architect uniquement si :**
- Nouvelle table ou modification de schéma DB
- Choix entre 2 approches d'architecture
- Impact sur 5+ fichiers existants

**Escalade de dev-agent → code-reviewer uniquement si :**
- Implémentation terminée (pas en cours)
- Build passe (`npm run build`)

**Escalade de code-reviewer → test-agent uniquement si :**
- Review validée (pas de bloquant)

---

## BMAD COMPLET — Nouveau besoin vague

> Utilisé uniquement quand le besoin n'est pas encore découpé en ticket backlog.

### Phase 1 : Analyse
- **Agent** : analyst
- **Input** : besoin exprimé par le PO
- **Output** : project brief (`.claude/templates/project-brief.md`)
- **Gate** : PO valide le brief

### Phase 2 : Planification
- **Agent** : pm
- **Input** : project brief validé
- **Output** : PRD + epics
- **Gate** : PO valide le PRD

### Phase 3 : Architecture
- **Agent** : architect
- **Skip si** : changement simple sans impact archi
- **Output** : ADR si décision structurante

### Phase 4 : Stories
- **Agent** : sm
- **Output** : stories implémentables + tickets backlog
- **Gate** : checklist `.claude/checklists/story-draft.md`

### Phases 5-8 : identiques au Fast-Track
→ dev-agent → code-reviewer → test-agent → PO

---

## Cas triviaux (skip tout)
- **Typo / renommage / config** : fix direct, pas d'agent
- **Bug 1-ligne avec cause identifiée** : dev-agent seul, pas de review nécessaire si diff < 5 lignes
