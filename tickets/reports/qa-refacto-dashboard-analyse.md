# QA Note — Refacto Dashboard / Analyse

Date : 2026-04-02
Branche : `refacto`
Commit cible : `b228e17`

## Objectif

Valider la refacto des flux IA, la robustesse Fair Value, et l'itération UI sur les pages dashboard et analyse.

## Préconditions

- Utilisateur authentifié
- Portfolio avec au moins :
  - 1 action US
  - 1 action EU
  - 1 ETF ou actif avec fair value possiblement `null`
- Variables d'environnement IA/FMP configurées

## Checklist Fonctionnelle

### Dashboard

- Ouvrir `/dashboard`
- Vérifier que le header sticky reste lisible sur mobile et desktop
- Vérifier que le hero de page s'affiche correctement sans overflow
- Vérifier que `PortfolioSummary`, `PerformanceSection`, `Liquidités` et `Mes positions` sont visibles sans glitch visuel

### Tableau des positions

- Vérifier le tri par `P&L €`, `P&L %`, `Valeur`, `Poids`, `Prix`, `Ticker`
- Vérifier que les cartes restent lisibles sur mobile
- Ouvrir plusieurs drawers de position et vérifier l'absence de freeze UI

### Fair Value dans Mes positions

- Depuis une ligne de position, cliquer sur `Fair value`
- Vérifier qu'un prix courant s'affiche toujours si Yahoo renvoie un prix live
- Vérifier que le prix affiché dans `Fair value` est aligné avec le `Prix live` de la ligne
- Vérifier que le bouton `?` ouvre toujours une explication, même si `fair_value` est `null`
- Vérifier que la popup affiche :
  - prix courant
  - fair value si disponible
  - signal
  - méthodologie
  - confiance

### Drawer position

- Ouvrir le drawer d'une position
- Vérifier le résumé haut de carte
- Vérifier le bloc `Analyse IA`
- Cliquer sur `Calculer la fair value`
- Vérifier que le composant complet de fair value fonctionne dans le drawer

### Page Analyse

- Ouvrir `/dashboard/analyse`
- Vérifier le hero, les métriques de tête et l'alignement mobile
- Vérifier les onglets `Analyse rapide`, `Fair value`, `Buffett / Lynch`
- Vérifier les recherches ticker avec suggestions
- Vérifier le chat IA :
  - envoi message
  - affichage réponse
  - scroll automatique

## Checklist Robustesse IA

- Envoyer un ticker invalide via l'UI si possible
- Vérifier qu'une erreur utilisateur propre remonte
- Tester un actif pour lequel le modèle ne renvoie pas de fair value fiable
- Vérifier le fallback prix live
- Vérifier qu'un actif avec devise USD et un actif avec devise GBP/GBp retournent des montants cohérents en EUR

## Résultats attendus

- Pas d'écart entre le prix live du tableau et le prix live affiché dans Fair Value quand Yahoo est disponible
- Pas de disparition d'explication si `fair_value` est `null`
- Aucune erreur console bloquante
- Aucune régression de navigation mobile

## Points de vigilance

- Les modèles IA peuvent toujours varier sur le texte narratif
- Le prix live Yahoo peut échouer ponctuellement ; dans ce cas, vérifier le comportement de fallback
- Les caches Supabase et applicatifs peuvent rendre un résultat déjà calculé
