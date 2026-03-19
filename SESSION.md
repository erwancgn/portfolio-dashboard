# SESSION.md — Contexte de la session en cours

> Ce fichier est réécrit au début de chaque session.
> Il contient uniquement ce dont l'agent a besoin pour travailler MAINTENANT.
> Historique complet → voir DEVLOG.md

---

## Session 5 — Objectif : TASK-006 Auth complète

### Tickets de cette session
1. **Créer `/auth/callback/route.ts`** — route qui reçoit le token OAuth après login
2. **Créer `/dashboard/page.tsx`** — page principale, accessible uniquement si connecté
3. **Tester le flux complet** : login → callback → dashboard → redirect si non connecté
4. **Fermer TASK-006** sur GitHub

### État actuel du code
- `/auth/login/page.tsx` existe et fonctionne
- `src/lib/supabase/client.ts` et `server.ts` existent
- `src/proxy.ts` existe (gère la redirection auth)
- `src/types/database.ts` est généré et à jour
- Build passe sans erreur

### Fichiers à créer
- `src/app/auth/callback/route.ts`
- `src/app/dashboard/page.tsx`

### Fichiers à potentiellement modifier
- `src/proxy.ts` (ajouter la logique de redirection si non connecté)

### Ce qu'il ne faut PAS faire
- Ne pas toucher aux clients Supabase existants
- Ne pas modifier la migration SQL
- Ne pas installer de nouveau package (tout est déjà là avec `@supabase/ssr`)
