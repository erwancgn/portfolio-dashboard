# SESSION.md — Contexte de la session en cours

> Ce fichier est réécrit au début de chaque session.
> Il contient uniquement ce dont l'agent a besoin pour travailler MAINTENANT.
> Historique complet → voir DEVLOG.md

---

## Session 5 — Review stratégique + Auth + FIX-001

### Phase 1 : Review stratégique avec Tech Lead (Opus)

Avant de coder, prendre du recul sur le projet.

**Objectif :** Valider que le backlog actuel (38 tickets) mène bien au MVP le plus court.

**Questions à poser au Tech Lead :**
1. Quel est le chemin le plus court vers un dashboard qui affiche mes vraies positions avec les prix en temps réel ?
2. Parmi les 38 tickets existants, lesquels sont critiques pour le MVP, lesquels peuvent attendre la V1.5 ?
3. L'ordre actuel des tickets est-il optimal ? Faut-il réorganiser ?
4. Y a-t-il des tickets manquants qui bloquent le MVP ?
5. Créer les tickets identifiés via `gh issue create` (après validation PO)

**Livrable attendu :** Une priorisation claire, des tickets créés/archivés dans GitHub.

### Phase 2 : Installer les skills Vercel

```bash
npx skills add vercel-labs/agent-skills@react-best-practices
npx skills add vercel-labs/next-skills --skill next-best-practices
npx skills add vercel-labs/next-skills --skill next-cache-components
npx skills list
```

### Phase 3 : TASK-006 Auth — tester le flux complet

**Ce qui existe déjà :**
- `/auth/login/page.tsx` — page de login
- `/auth/callback/route.ts` — callback OAuth
- `/dashboard/page.tsx` — page dashboard
- `src/lib/supabase/client.ts` et `server.ts` — clients Supabase
- `src/proxy.ts` — proxy auth avec redirection

**Ce qui reste à vérifier / compléter :**
1. Le flux complet fonctionne-t-il ? login → callback → dashboard → redirect si non connecté
2. Le proxy redirige-t-il vers `/auth/login` quand l'utilisateur n'est pas connecté ?
3. Le dashboard utilise-t-il le client server Supabase (pas le browser) ?
4. Si tout fonctionne → fermer TASK-006 sur GitHub

**Ce qu'il ne faut PAS faire :**
- Ne pas toucher aux clients Supabase existants
- Ne pas modifier la migration SQL
- Ne pas installer de nouveau package

### Phase 4 : FIX-001 — Remplacer style={{}} inline

**Ticket à créer dans GitHub avant de commencer :**
```bash
gh issue create --repo erwancgn/portfolio-dashboard \
  --title "[FIX-001] Remplacer les style={{}} inline par des classes Tailwind" \
  --label "bug,p1" \
  --milestone "MVP" \
  --body "## Contexte
Le CLAUDE.md interdit style={{}} dans les composants. Deux fichiers violent cette règle.
Identifié lors de l'audit Session 4.

## Ce qui doit être fait
- [ ] Remplacer tous les style={{}} par des classes Tailwind v4
- [ ] Utiliser la syntaxe bg-[var(--color-xxx)] pour les CSS variables

## Fichiers concernés
- src/app/dashboard/page.tsx — modifier
- src/app/auth/login/page.tsx — modifier
- src/components/layout/LogoutButton.tsx — vérifier

## Critères d'acceptation
- [ ] CA1 : Aucun style={{}} dans dashboard/page.tsx
- [ ] CA2 : Aucun style={{}} dans login/page.tsx
- [ ] CA3 : CSS variables via bg-[var(--color-xxx)], text-[var(--color-xxx)]
- [ ] CA4 : Rendu visuel identique
- [ ] CA5 : Aucun style inline dans src/app/ et src/components/

## Hors périmètre
- Ne pas modifier la structure des composants
- Ne pas changer les couleurs du thème
- Ne pas toucher à globals.css

## Definition of Done
- [ ] Build passe (npm run build)
- [ ] TypeScript passe (npx tsc --noEmit)
- [ ] Lint passe (npm run lint)
- [ ] Aucune violation CLAUDE.md
- [ ] PO a validé le résultat"
```

Puis l'agent dev implémente, le mentor explique, l'agent test vérifie.

### Phase 5 : Tester les agents

- Tester `/dev-workflow` sur FIX-001
- Tester `/test-workflow` après implémentation
- Vérifier que l'agent test lit les critères depuis `gh issue view`
- Vérifier que l'agent test produit un rapport structuré avec la section "Leçons capturées"
- Vérifier que l'agent test ne peut pas modifier de fichiers (allowed-tools)
- Ajuster les skills selon les résultats réels
