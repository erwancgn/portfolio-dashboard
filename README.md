# 📈 Portfolio Dashboard IA

Dashboard financier personnel de niveau professionnel, enrichi d'agents IA
pour surveiller, analyser et synthétiser l'état du portfolio et les marchés.

## Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Frontend | Next.js 16 + TypeScript | Structure et pages de l'app |
| Style | Tailwind CSS v4 | Design système noir/bleu |
| Auth + BDD | Supabase (PostgreSQL) | Données utilisateur + sécurité |
| Hébergement | Vercel | Déploiement et crons |
| Prix actions/ETF/Crypto | Yahoo Finance | Cours temps réel (sans clé API) |
| Taux de change | Frankfurter API | Conversion EUR/USD/etc |
| Agents IA | Claude (Anthropic) | Surveillance + analyse |

## Prérequis

- Node.js v20 LTS (`nvm use 20`)
- Docker Desktop (pour Supabase local)
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)
- Clé API Anthropic

## Installation
```bash
# 1. Cloner le projet
git clone https://github.com/erwancgn/portfolio-dashboard
cd portfolio-dashboard

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.local.example .env.local
# Remplir les valeurs dans .env.local

# 4. Lancer Supabase en local
supabase start

# 5. Appliquer les migrations
supabase db reset

# 6. Lancer en développement
npm run dev
# → http://localhost:3000
```

## Structure du projet
```
src/
├── app/          → Pages et API Routes (Next.js App Router)
├── components/   → Composants React réutilisables
├── lib/          → Logique métier (calculs, APIs, utils)
├── agents/       → Agents IA (surveillance, newsletter)
└── types/        → Types TypeScript
```

## Variables d'environnement

Voir `.env.local.example` pour la liste complète.
Ne jamais committer `.env.local`.

## Documentation

| Fichier | Contenu |
|---|---|
| `DEVLOG.md` | Journal de bord technique — erreurs et solutions |
| `ARCHITECTURE.md` | Décisions techniques et pourquoi |
| `CHANGELOG.md` | Historique des versions |

## Versions

Voir `CHANGELOG.md`