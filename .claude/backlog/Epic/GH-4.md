# GH-4 — [EPIC 4] DCA (Dollar Cost Averaging)

## Objectif
Permettre au PO de gérer sa stratégie d'investissement régulier : configurer des règles DCA par titre, enregistrer les passages, et consulter l'historique.

## User Stories
- [ ] GH-22 / US-011 : Configurer une règle DCA
- [ ] GH-23 / US-012 : Enregistrer un passage DCA
- [ ] GH-24 / US-013 : Voir l'historique des passages DCA

## Dépendances
- Reporté en v1.5
- Migration DB : tables `dca_rules` et `dca_history` requises (story séparée)

## Critères d'acceptation (epic-level)
- [ ] Le PO peut configurer une règle DCA pour chaque position
- [ ] Chaque passage DCA recalcule correctement le PRU moyen pondéré
- [ ] L'historique est consultable et trié par date décroissante
