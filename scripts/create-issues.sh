#!/bin/bash

# =============================================================
# Script de création automatique des issues GitHub
# Portfolio Dashboard IA
# Usage : bash scripts/create-issues.sh TON_USERNAME/portfolio-dashboard
# =============================================================

REPO=$1

if [ -z "$REPO" ]; then
  echo "❌ Usage : bash scripts/create-issues.sh USERNAME/portfolio-dashboard"
  exit 1
fi

echo "🚀 Création des issues pour $REPO..."

# =============================================================
# MILESTONES
# =============================================================
echo "📌 Création des milestones..."
gh api repos/$REPO/milestones --method POST -f title="MVP" -f description="Dashboard + Positions + DCA + Prix temps réel" > /dev/null
gh api repos/$REPO/milestones --method POST -f title="V1.5" -f description="Agent Surveillance + Alertes email" > /dev/null
gh api repos/$REPO/milestones --method POST -f title="V2" -f description="Newsletter + Chat + MCP + Fiscalité" > /dev/null
echo "✅ Milestones créées"

# Récupérer les IDs des milestones
MVP_ID=$(gh api repos/$REPO/milestones | jq '.[] | select(.title=="MVP") | .number')
V15_ID=$(gh api repos/$REPO/milestones | jq '.[] | select(.title=="V1.5") | .number')
V2_ID=$(gh api repos/$REPO/milestones  | jq '.[] | select(.title=="V2")  | .number')

# =============================================================
# EPICs
# =============================================================
echo "📦 Création des EPICs..."

gh issue create --repo $REPO \
  --title "[EPIC 1] Fondations techniques" \
  --label "epic,p0" \
  --milestone "MVP" \
  --body "Tout ce qui doit exister avant d'écrire une seule ligne de fonctionnel.

**Contient :**
- TASK-001 : Installer l'environnement
- TASK-002 : Initialiser la documentation
- TASK-003 : Créer le projet Next.js
- TASK-004 : Initialiser Git + GitHub
- TASK-005 : Configurer Supabase
- TASK-006 : Configurer l'authentification"

gh issue create --repo $REPO \
  --title "[EPIC 2] Gestion des positions" \
  --label "epic,p0" \
  --milestone "MVP" \
  --body "Le cœur du produit. Sans positions, rien d'autre n'a de sens.

**Contient :**
- US-001 : Ajouter une position
- US-002 : Voir la liste des positions
- US-003 : Modifier le prix actuel
- US-004 : Supprimer une position
- US-005 : Rafraîchir tous les prix"

gh issue create --repo $REPO \
  --title "[EPIC 3] Dashboard analytique" \
  --label "epic,p0" \
  --milestone "MVP" \
  --body "La valeur principale pour consulter son portfolio quotidiennement.

**Contient :**
- US-006 : Vue Global
- US-007 : Vue Poids
- US-008 : Vue Pays
- US-009 : Vue Secteur
- US-010 : Vue P&L"

gh issue create --repo $REPO \
  --title "[EPIC 4] DCA (Dollar Cost Averaging)" \
  --label "epic,p0" \
  --milestone "MVP" \
  --body "Fonctionnalité différenciante pour gérer sa stratégie d'investissement régulier.

**Contient :**
- US-011 : Configurer une règle DCA
- US-012 : Enregistrer un passage DCA
- US-013 : Historique des passages DCA"

gh issue create --repo $REPO \
  --title "[EPIC 5] Infrastructure & Déploiement" \
  --label "epic,p1" \
  --milestone "MVP" \
  --body "Rendre l'app accessible partout, sécurisée et maintenable.

**Contient :**
- TASK : Rate limiting
- TASK : Déploiement Vercel
- TASK : PWA
- TASK : Spending limit IA
- TASK : Tests"

echo "✅ EPICs créées"

# =============================================================
# TASKS — EPIC 1
# =============================================================
echo "🔧 Création des TASKs..."

gh issue create --repo $REPO \
  --title "[TASK-001] Installer l'environnement de développement" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Bloque :** tout le projet

**Pourquoi :** Sans Node.js, npm, Git et Cursor, on ne peut rien faire.

**Étapes :**
- [x] Installer nvm
- [x] Installer Node.js v20 LTS
- [x] Configurer nvm alias default 20
- [x] Installer Git via Xcode
- [x] Installer Cursor
- [x] Installer Homebrew
- [x] Installer GitHub CLI

**DOD :** node --version, npm --version, git --version retournent un numéro."

gh issue create --repo $REPO \
  --title "[TASK-002] Initialiser la documentation" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Pourquoi :** Garde-fou contre perte de contexte IA + maintenabilité.

**Fichiers :**
- [x] README.md
- [x] ARCHITECTURE.md
- [x] DEVLOG.md
- [x] CHANGELOG.md

**DOD :** 4 fichiers committés avec contenu."

gh issue create --repo $REPO \
  --title "[TASK-003] Créer le projet Next.js" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Pourquoi :** Le scaffolding crée la structure de fichiers standard.

**Étapes :**
- [x] npx create-next-app@latest
- [x] TypeScript + Tailwind + ESLint + App Router + src/
- [x] npm run dev → localhost:3000 fonctionnel

**DOD :** npm run dev lance l'app sans erreur."

gh issue create --repo $REPO \
  --title "[TASK-004] Initialiser Git + GitHub" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Pourquoi :** Git est la mémoire du projet.

**Étapes :**
- [x] git init
- [x] Repo GitHub privé créé
- [x] git remote add origin
- [x] Premier push

**DOD :** Code visible sur GitHub. .env.local absent du repo."

gh issue create --repo $REPO \
  --title "[TASK-005] Configurer Supabase" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Pourquoi :** Base de données + auth. Sans lui, les données ne persistent pas.

**Étapes :**
- [ ] Créer projet sur supabase.com
- [ ] Récupérer les clés API
- [ ] Ajouter dans .env.local
- [ ] Installer @supabase/supabase-js
- [ ] Créer lib/supabase/client.ts
- [ ] Créer lib/supabase/server.ts
- [ ] Exécuter migration SQL 001_init.sql
- [ ] Vérifier les 6 tables créées

**DOD :** 6 tables existent dans Supabase. Connexion sans erreur."

gh issue create --repo $REPO \
  --title "[TASK-006] Configurer l'authentification" \
  --label "task,p0" \
  --milestone "MVP" \
  --body "**Pourquoi :** Toutes les données sont liées à un user_id. Sans auth, le RLS bloque tout.

**Étapes :**
- [ ] Page login (email/password)
- [ ] Callback OAuth
- [ ] Middleware protection routes /dashboard/*
- [ ] AuthGuard component
- [ ] Test : accès sans login → redirect login
- [ ] Test : récupération mot de passe

**DOD :** Impossible d'accéder au dashboard sans être connecté."

echo "✅ TASKs EPIC 1 créées"

# =============================================================
# USER STORIES — EPIC 2
# =============================================================
echo "🟢 Création des User Stories..."

gh issue create --repo $REPO \
  --title "[US-001] Ajouter une position manuellement" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** saisir une position (ticker, nom, ISIN, quantité, PRU, enveloppe),
**Afin de** construire mon portfolio dans l'app.

**Critères d'acceptation :**
- [ ] Formulaire avec tous les champs
- [ ] Ticker + Tab → auto-complétion Finnhub
- [ ] Validation champs obligatoires
- [ ] Message succès après enregistrement
- [ ] Position visible dans le tableau

**DOD :** Position en base Supabase. Prix auto-complété. Visible dans tableau."

gh issue create --repo $REPO \
  --title "[US-002] Voir la liste de ses positions" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir toutes mes positions dans un tableau avec métriques calculées,
**Afin de** comprendre l'état de mon portfolio en un coup d'œil.

**Critères d'acceptation :**
- [ ] Colonnes : Ticker · Nom · Quantité · PRU · Prix actuel · Valeur · P&L € · P&L % · Poids %
- [ ] P&L positif vert, négatif rouge
- [ ] Tri par colonne
- [ ] Responsive mobile

**DOD :** Tableau affiché. Calculs vérifiés manuellement."

gh issue create --repo $REPO \
  --title "[US-003] Modifier le prix actuel d'une position" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** modifier le prix actuel en cliquant dessus,
**Afin de** mettre à jour mon portfolio sans recharger la page.

**Critères d'acceptation :**
- [ ] Clic sur prix → input inline
- [ ] Entrée valide, Échap annule
- [ ] Recalcul immédiat P&L + poids
- [ ] Sauvegarde en base

**DOD :** Prix modifié, P&L recalculé, données persistées."

gh issue create --repo $REPO \
  --title "[US-004] Supprimer une position" \
  --label "user-story,p1" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** supprimer une position,
**Afin de** garder mon portfolio à jour si je vends tous mes titres.

**Critères d'acceptation :**
- [ ] Bouton supprimer par ligne
- [ ] Confirmation avant suppression
- [ ] Recalcul pondérations
- [ ] Suppression en base

**DOD :** Position supprimée. Pondérations recalculées."

gh issue create --repo $REPO \
  --title "[US-005] Rafraîchir tous les prix en temps réel" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** rafraîchir tous les prix d'un clic,
**Afin d'** avoir une vue à jour de mon portfolio.

**Critères d'acceptation :**
- [ ] Bouton Rafraîchir dans la topbar
- [ ] Finnhub (actions/ETF) + CoinGecko (crypto) en parallèle
- [ ] Conversion EUR via Frankfurter
- [ ] Badge Marché fermé le weekend
- [ ] Snapshot sauvegardé après refresh

**DOD :** Prix mis à jour. Conversion EUR correcte. Badge marché fermé affiché."

# =============================================================
# USER STORIES — EPIC 3
# =============================================================

gh issue create --repo $REPO \
  --title "[US-006] Vue Global (stats + enveloppes)" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir la valeur totale, P&L global et répartition par enveloppe,
**Afin d'** évaluer la performance globale.

**Critères d'acceptation :**
- [ ] StatCards : Valeur totale · Investi · P&L · Nb positions
- [ ] Tableau répartition par enveloppe
- [ ] Graphe évolution historique
- [ ] Bouton Copier résumé portfolio

**DOD :** Stats correctes. Graphe avec 2+ points historique."

gh issue create --repo $REPO \
  --title "[US-007] Vue Poids (répartition par titre)" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir la pondération de chaque titre,
**Afin de** détecter les surpondérations.

**Critères d'acceptation :**
- [ ] 3 vues : Liste · Barres · Camembert
- [ ] Trié par valeur décroissante
- [ ] Poids % + valeur €

**DOD :** 3 vues fonctionnelles. Poids somme à 100%."

gh issue create --repo $REPO \
  --title "[US-008] Vue Pays" \
  --label "user-story,p1" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir la répartition géographique,
**Afin de** gérer mon risque pays.

**Critères d'acceptation :**
- [ ] Agrégation par pays
- [ ] 3 vues : Liste · Barres · Camembert
- [ ] P&L par pays

**DOD :** Agrégation correcte. 3 vues fonctionnelles."

gh issue create --repo $REPO \
  --title "[US-009] Vue Secteur" \
  --label "user-story,p1" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir la répartition sectorielle,
**Afin de** gérer mon risque de concentration.

**Critères d'acceptation :**
- [ ] Agrégation par secteur
- [ ] 3 vues : Liste · Barres · Camembert
- [ ] P&L par secteur

**DOD :** Agrégation correcte. 3 vues fonctionnelles."

gh issue create --repo $REPO \
  --title "[US-010] Vue P&L détaillé" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir le détail des plus et moins-values par position,
**Afin de** savoir précisément où je gagne et où je perds.

**Critères d'acceptation :**
- [ ] Tableau trié par P&L décroissant
- [ ] StatCards : Meilleure · Pire · Nb gain · Nb perte
- [ ] Couleurs vert/rouge

**DOD :** Calculs P&L vérifiés manuellement sur 3 positions test."

# =============================================================
# USER STORIES — EPIC 4
# =============================================================

gh issue create --repo $REPO \
  --title "[US-011] Configurer une règle DCA" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** définir un montant et une fréquence de DCA pour chaque titre,
**Afin d'** automatiser le suivi de ma stratégie d'investissement régulier.

**Critères d'acceptation :**
- [ ] Tableau listant toutes les positions
- [ ] Par ligne : montant · fréquence · toggle actif/inactif
- [ ] Sauvegarde immédiate en base
- [ ] Date prochain DCA affichée
- [ ] Indicateur si DCA en retard

**DOD :** Règles en base. Date prochain DCA correcte pour chaque fréquence."

gh issue create --repo $REPO \
  --title "[US-012] Enregistrer un passage DCA" \
  --label "user-story,p0" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** cliquer sur DCA effectué pour enregistrer mes achats réguliers,
**Afin de** mettre à jour automatiquement mon PRU et mes positions.

**Critères d'acceptation :**
- [ ] Bouton DCA effectué dans l'onglet DCA
- [ ] Pop-up : titres avec DCA actif uniquement
- [ ] Montant pré-rempli · prix d'exécution à saisir · quantité calculée auto
- [ ] Confirmation → recalcul PRU moyen pondéré
- [ ] next_expected_at recalculé
- [ ] Message succès avec récap

**Formule PRU :**
nouveau_pru = (ancienne_quantité × ancien_pru + montant) / (ancienne_quantité + quantité_achetée)

**DOD :** PRU recalculé correctement. Historique en base."

gh issue create --repo $REPO \
  --title "[US-013] Voir l'historique des passages DCA" \
  --label "user-story,p1" \
  --milestone "MVP" \
  --body "**En tant que** PO,
**Je veux** voir l'historique de tous mes passages DCA,
**Afin de** suivre ma discipline d'investissement.

**Critères d'acceptation :**
- [ ] Tableau : Date · Ticker · Montant · Prix · Quantité · Nouveau PRU
- [ ] Trié par date décroissante
- [ ] Total investi via DCA

**DOD :** Historique affiché. Données cohérentes avec les positions."

# =============================================================
# TASKS — EPIC 5
# =============================================================

gh issue create --repo $REPO \
  --title "[TASK-007] Rate limiting sur les API Routes" \
  --label "task,p1" \
  --milestone "MVP" \
  --body "**Pourquoi :** Protéger contre dérive de coût IA et épuisement quota Finnhub.

**Étapes :**
- [ ] Créer src/lib/rate-limiter.ts
- [ ] Appliquer sur /api/quote (max 30 req/min)
- [ ] Appliquer sur /api/agents/* (max 20 req/jour)

**DOD :** Appel au-delà de la limite → HTTP 429."

gh issue create --repo $REPO \
  --title "[TASK-008] Déploiement Vercel" \
  --label "task,p1" \
  --milestone "MVP" \
  --body "**Pourquoi :** L'app doit être accessible depuis n'importe quel appareil.

**Étapes :**
- [ ] Connecter repo GitHub à Vercel
- [ ] Configurer variables d'environnement Vercel
- [ ] Premier déploiement automatique
- [ ] Tester URL de production

**DOD :** App accessible sur URL Vercel."

gh issue create --repo $REPO \
  --title "[TASK-009] PWA (Progressive Web App)" \
  --label "task,p2" \
  --milestone "MVP" \
  --body "**Pourquoi :** Installer l'app sur écran d'accueil iPhone.

**Étapes :**
- [ ] Installer next-pwa
- [ ] Créer public/manifest.json
- [ ] Configurer next.config.js
- [ ] Tester sur iPhone

**DOD :** Icône sur écran d'accueil. App s'ouvre en plein écran."

gh issue create --repo $REPO \
  --title "[TASK-010] Spending limit IA + compteur tokens" \
  --label "task,p1" \
  --milestone "MVP" \
  --body "**Pourquoi :** Protéger contre dérive de coût IA (~7€/mois estimé).

**Étapes :**
- [ ] Spending limit 20€/mois sur dashboard Anthropic
- [ ] Table api_usage dans Supabase
- [ ] Logger chaque appel IA
- [ ] Afficher consommation dans settings

**DOD :** Spending limit actif. Compteur visible dans l'app."

gh issue create --repo $REPO \
  --title "[TASK-011] Tests unitaires" \
  --label "task,p1" \
  --milestone "MVP" \
  --body "**Pourquoi :** Les calculs financiers doivent être fiables. Une erreur = mauvaise décision.

**Étapes :**
- [ ] Installer Vitest
- [ ] Tests : calculations.ts (PRU, P&L, poids)
- [ ] Tests : dca.ts (nouveau PRU, next date)
- [ ] Tests : market-hours.ts

**DOD :** npm run test passe sans erreur. Couverture >80% sur lib/."

# =============================================================
# V1.5
# =============================================================

gh issue create --repo $REPO \
  --title "[EPIC 6] Agent Surveillance" \
  --label "epic,p0" \
  --milestone "V1.5" \
  --body "Surveillance automatique du portfolio avec alertes email."

gh issue create --repo $REPO \
  --title "[US-014] Surveillance automatique du portfolio" \
  --label "user-story,p0" \
  --milestone "V1.5" \
  --body "**En tant que** PO,
**Je veux** être alerté par email si un titre chute de plus de X%,
**Afin de** réagir sans surveiller l'app en permanence.

**Critères d'acceptation :**
- [ ] Cron Vercel toutes les 15 min (jours ouvrés)
- [ ] Agent Claude Haiku analyse prix vs seuils
- [ ] Email via Resend si anomalie
- [ ] Historique alertes dans l'app
- [ ] Seuil configurable par titre"

gh issue create --repo $REPO \
  --title "[EPIC 7] Agent Chat intégré" \
  --label "epic,p1" \
  --milestone "V1.5" \
  --body "Chat IA avec contexte portfolio injecté automatiquement."

gh issue create --repo $REPO \
  --title "[US-015] Chat IA avec contexte portfolio" \
  --label "user-story,p1" \
  --milestone "V1.5" \
  --body "**En tant que** PO,
**Je veux** poser des questions sur mon portfolio dans l'app,
**Afin d'** obtenir des analyses sans recopier mon contexte.

**Critères d'acceptation :**
- [ ] Interface chat avec streaming
- [ ] Contexte portfolio injecté automatiquement
- [ ] Compteur tokens quotidien visible
- [ ] Limite quotidienne configurable"

# =============================================================
# V2
# =============================================================

gh issue create --repo $REPO \
  --title "[EPIC 8] Newsletter IA hebdomadaire" \
  --label "epic,p1" \
  --milestone "V2" \
  --body "Rapport hebdomadaire automatique généré par IA."

gh issue create --repo $REPO \
  --title "[EPIC 9] MCP (Model Context Protocol)" \
  --label "epic,p2" \
  --milestone "V2" \
  --body "Accès Gemini/Claude externe à l'app en temps réel."

gh issue create --repo $REPO \
  --title "[EPIC 10] Fiscalité & reporting" \
  --label "epic,p1" \
  --milestone "V2" \
  --body "Tableau des cessions CTO exportable CSV pour déclaration d'impôts."

gh issue create --repo $REPO \
  --title "[EPIC 11] Import CSV Trade Republic" \
  --label "epic,p2" \
  --milestone "V2" \
  --body "Import automatique depuis export CSV/PDF Trade Republic."

gh issue create --repo $REPO \
  --title "[EPIC 12] Corbeille & suppression douce" \
  --label "epic,p2" \
  --milestone "V2" \
  --body "Restaurer une position supprimée par erreur."

echo ""
echo "✅ Tous les tickets ont été créés !"
echo "👉 Board : https://github.com/$REPO/issues"