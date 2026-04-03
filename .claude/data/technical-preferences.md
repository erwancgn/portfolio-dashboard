# Préférences techniques — Portfolio Dashboard

## Stack validée
- Framework : Next.js 16 (App Router)
- UI : React 19, Tailwind v4
- Backend : Supabase (PostgreSQL + Auth + RLS)
- Déploiement : Vercel Hobby (gratuit)
- Types : TypeScript strict
- IA : Gemini 2.0 Flash (principal), Groq Llama 3.3 70B (fallback)

## Contraintes budget
- Vercel : plan Hobby gratuit
- Supabase : plan gratuit
- APIs IA : ~7€/mois max
- FMP (Financial Modeling Prep) : plan gratuit, quotas limités

## Conventions validées
- Server Components par défaut
- `proxy.ts` pour middleware (Next.js 16)
- CSS variables pour couleurs, Tailwind pour layout
- Pas de tests unitaires pour le MVP (QA manuelle par test-agent)
- Commits conventionnels, validation PO obligatoire

## APIs externes
- Yahoo Finance : actions, ETF, crypto (sans clé, via scraping)
- FMP : profils entreprises, dividendes (clé gratuite, quotas)
- Frankfurter : taux de change EUR (gratuit, sans clé)
- Gemini : analyse IA du portfolio
- Groq : fallback IA si quota Gemini dépassé
