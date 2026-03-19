# Checklist de régression — Portfolio Dashboard

> Ce fichier est mis à jour après chaque ticket terminé.
> L'agent test le consulte pour vérifier qu'aucune fonctionnalité existante n'est cassée.

## Fonctionnalités validées

### Session 2 — TASK-005 : Supabase configuré
- [ ] `supabase start` lance l'environnement local sans erreur
- [ ] 6 tables existent dans Supabase Studio
- [ ] `.env.local` contient les clés locales (pas de clé prod)

### Session 3 — Clients Supabase + Auth
- [ ] `src/lib/supabase/client.ts` exporte `createClient` (browser)
- [ ] `src/lib/supabase/server.ts` exporte `createClient` (server)
- [ ] `src/types/database.ts` existe et est cohérent avec le schéma
- [ ] `/auth/login` affiche la page de login sans erreur
- [ ] `src/proxy.ts` existe (pas `middleware.ts`)
- [ ] `npm run build` passe sans erreur
- [ ] `npx tsc --noEmit` passe sans erreur

### Session 4 — (prochaine)
- [ ] `/auth/callback` route créée et fonctionnelle
- [ ] `/dashboard` page créée et accessible
- [ ] Redirection si non connecté fonctionne
- [ ] TASK-006 fermée

---

## Vérifications permanentes (à chaque test)

### TypeScript
- [ ] Pas de `any` dans le code source
- [ ] `npx tsc --noEmit` passe

### Sécurité
- [ ] Aucun `NEXT_PUBLIC_` sur une clé secrète
- [ ] Pas de clé API dans le code côté client

### Style
- [ ] Pas de `style={{}}` inline
- [ ] Tailwind pour layout, CSS variables pour couleurs

### Structure
- [ ] Fichiers < 200 lignes
- [ ] Nommage : camelCase variables, PascalCase composants, kebab-case fichiers
