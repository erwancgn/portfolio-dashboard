# SESSION.md — Contexte de la session en cours

> Ce fichier est réécrit au début de chaque session.
> Il contient uniquement ce dont l'agent a besoin pour travailler MAINTENANT.
> Historique complet → voir DEVLOG.md

---

## Session 5 — Review stratégique + TASK-006 Auth

### Phase 1 : Review stratégique avec Tech Lead (Opus)

Avant de coder, prendre du recul sur le projet.

**Objectif :** Valider que le backlog actuel (38 tickets) mène bien au MVP le plus court.

**Questions à poser au Tech Lead :**
1. Quel est le chemin le plus court vers un dashboard qui affiche mes vraies positions avec les prix en temps réel ?
2. Parmi les 38 tickets existants, lesquels sont critiques pour le MVP, lesquels peuvent attendre la V1.5 ?
3. L'ordre actuel des tickets est-il optimal ? Faut-il réorganiser ?
4. Y a-t-il des tickets manquants qui bloquent le MVP ?

**Livrable attendu :** Une priorisation claire, des tickets à déplacer/créer/archiver.

### Phase 2 : Installer les skills Vercel

```bash
npx skills add vercel-labs/agent-skills@react-best-practices
npx skills add vercel-labs/next-skills --skill next-best-practices
npx skills add vercel-labs/next-skills --skill next-cache-components
npx skills list
```

### Phase 3 : TASK-006 Auth complète

**Ce qui existe déjà :**
- `/auth/login/page.tsx` — page de login
- `/auth/callback/route.ts` — callback OAuth
- `/dashboard/page.tsx` — page dashboard
- `src/lib/supabase/client.ts` et `server.ts` — clients Supabase
- `src/proxy.ts` — proxy auth

**Ce qui reste à vérifier / compléter :**
1. Le flux complet fonctionne-t-il ? login → callback → dashboard → redirect si non connecté
2. Le proxy redirige-t-il vers `/auth/login` quand l'utilisateur n'est pas connecté ?
3. Le dashboard utilise-t-il le client server Supabase (pas le browser) ?
4. Si tout fonctionne → fermer TASK-006 sur GitHub

**Ce qu'il ne faut PAS faire :**
- Ne pas toucher aux clients Supabase existants
- Ne pas modifier la migration SQL
- Ne pas installer de nouveau package

### Phase 4 : Tester les agents

- Tester `/dev-workflow` sur TASK-006
- Tester `/test-workflow` après implémentation
- Vérifier que l'agent test produit un rapport structuré avec la section "Leçons capturées"
- Vérifier que l'agent test ne peut pas modifier de fichiers (allowed-tools)
- Ajuster les skills selon les résultats réels
