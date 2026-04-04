# GH-3 — [EPIC 3] Dashboard analytique

## Objectif
Livrer les vues analytiques du portfolio (Global, Poids, Pays, Secteur, P&L) pour que le PO puisse consulter l'état de son portfolio au quotidien.

## User Stories
- [ ] US-006 : Vue Global — valeur totale, répartition
- [ ] US-007 : Vue Poids — poids de chaque position dans le portfolio
- [ ] US-008 : Vue Pays — répartition géographique
- [ ] US-009 : Vue Secteur — répartition sectorielle
- [ ] US-010 : Vue P&L — plus-values latentes et réalisées

## Dépendances
- EPIC 5 Infrastructure (déploiement) pour la mise en production
- Données de marché : route `/api/quote` disponible

## Critères d'acceptation (epic-level)
- [ ] Les 5 vues sont accessibles depuis le dashboard
- [ ] Les données sont cohérentes entre les vues
- [ ] Temps de chargement < 2s sur connexion normale
