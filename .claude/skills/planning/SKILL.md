---
name: planning
description: "Workflow de planification BMAD complet : du besoin PO aux stories implémentables. Déclencher quand le PO exprime un nouveau besoin ou quand on dit 'planifie', 'nouvelle feature', 'on veut ajouter'."
context: fork
metadata:
  version: "1.0"
---

# Planning Workflow — BMAD

## Quand utiliser
- Le PO exprime un nouveau besoin ou une idée de feature
- Un changement structurant est envisagé (nouvelle page, nouveau modèle de données, etc.)
- Pas pour les bugs simples ou corrections mineures

## Séquence

### 1. Analyse (analyst)
1. Lire `.claude/data/technical-preferences.md` pour les contraintes
2. Poser 2-3 questions de clarification au PO
3. Rechercher le contexte (WebSearch si pertinent)
4. Produire un project brief selon `.claude/templates/project-brief.md`
5. Valider avec le PO

### 2. PRD (pm)
1. Prendre le brief validé
2. Transformer en PRD selon `.claude/templates/prd.md`
3. Découper en epics selon `.claude/templates/epic.md`
4. Prioriser (P0/P1/P2)
5. Identifier risques et mitigations
6. Valider avec le PO

### 3. Architecture (architect) — si nécessaire
1. Lire ARCHITECTURE.md pour les décisions passées
2. Analyser l'impact technique du PRD
3. Produire un ADR si décision structurante
4. Vérifier `.claude/checklists/architecture-review.md`
5. Valider avec le PO

### 4. Stories (sm)
1. Découper chaque epic en stories
2. Chaque story suit `.claude/templates/story.md`
3. Vérifier chaque story contre `.claude/checklists/story-draft.md`
4. Créer les tickets GitHub via `gh issue create`
5. Ordonner par dépendance
