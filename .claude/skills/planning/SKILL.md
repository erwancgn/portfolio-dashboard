---
name: planning
description: "Planification d'une nouvelle feature : du besoin PO à la story dans le backlog. Déclencher quand le PO exprime un nouveau besoin ou quand on dit 'planifie', 'nouvelle feature', 'on veut ajouter'."
context: fork
metadata:
  version: "2.0"
  last-updated: "2026-04-04"
---

# Planning — Nouveau besoin → Story backlog

## Quand utiliser

- Le PO exprime un nouveau besoin ou une idée de feature
- Un changement structurant est envisagé (nouvelle page, nouveau modèle de données)
- **Pas** pour les bugs simples ou corrections mineures → fix direct

## Processus (3 étapes)

### 1. Comprendre

1. Lire `.claude/data/technical-preferences.md` (contraintes stack/budget)
2. Poser **2-3 questions de clarification** au PO — ne pas sauter cette étape
3. Rechercher le contexte si utile (WebSearch pour benchmarker)

### 2. Cadrer

Résumer en 5 lignes :
- **Problème** : ce que l'utilisateur ne peut pas faire aujourd'hui
- **Solution** : ce qu'on va construire
- **Hors scope** : ce qu'on ne fait PAS dans ce ticket
- **Contraintes** : impact DB ? nouvelle dépendance ? >5 fichiers ?
- **Taille** : XS / S / M / L (voir CLAUDE.md)

Si décision d'architecture → s'arrêter et appeler le tech-lead avant de continuer.

### 3. Créer la story

Créer `GH-XX.md` dans `.claude/backlog/Story/` selon `.claude/templates/story.md`.

**Critères d'acceptation obligatoires :**
- Format Given/When/Then
- Fichiers concernés listés avec chemins exacts (Glob pour les trouver)
- Section `## Estimation` avec taille XS/S/M/L/XL + justification

Valider avec le PO avant de passer au dev-agent.
