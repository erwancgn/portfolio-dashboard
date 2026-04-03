# Checklist — Architecture Review

Avant de commencer l'implémentation d'un changement structurant :

- [ ] L'approche a été validée par l'architect ou le tech-lead
- [ ] Les alternatives ont été documentées (ADR si décision majeure)
- [ ] L'impact sur les fichiers existants est listé
- [ ] Pas de nouvelle dépendance npm sans validation PO
- [ ] Pas de changement de schéma DB sans migration planifiée
- [ ] L'approche est réversible, ou l'irréversibilité est acceptée par le PO
