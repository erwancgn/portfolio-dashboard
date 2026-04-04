# CLAUDE.md — Portfolio Dashboard

> Tableau de bord financier personnel.  
> Stack : Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Vercel Hobby

---

## Workflow

```
Nouveau besoin  →  /planning  →  dev-agent (implémente)  →  test-agent (vérifie)  →  PO valide  →  commit
Bug / correction →  fix direct (pas d'agent pour XS/S)
Décision archi  →  tech-lead
UX / design     →  ux-agent
```

---

## Agents disponibles

| Agent | Quand l'appeler |
|-------|----------------|
| `dev-agent` | Implémenter un ticket — défaut pour tout code |
| `ux-agent` | Audit design, redesign, composant UI |
| `test-agent` | Vérifier les critères d'acceptation, détecter les régressions |
| `tech-lead` | Trade-offs, architecture, brainstorming, update SESSION.md |
| `mentor` | Expliquer du code ou un concept au PO |

---

## Modèles

```
Haiku 4.5   →  XS/S (bug simple, 1-3 fichiers)      ← défaut
Sonnet 4.6  →  M/L (feature complète, 3-8 fichiers)
Opus 4.6    →  jamais — pas justifié pour ce projet
```

---

## Tailles de tâches

| Taille | Fichiers | Route |
|--------|----------|-------|
| XS | 1 | Fix direct |
| S | 2-3 | dev-agent (Haiku) |
| M | 3-5 | dev-agent (Sonnet) |
| L | 5-8 | dev-agent + tech-lead si archi |
| XL | 8+ | /planning d'abord |

---

## Règles absolues

- Ne jamais lire/exposer `.env.local` ou credentials
- Ne jamais `git push` sans validation PO
- Ne jamais modifier la DB de production
- Toujours lire un fichier avant de le modifier
- Les agents modifient directement, expliquent après — PO valide en fin de tâche

---

## Conventions & règles techniques

| Sujet | Fichier |
|-------|---------|
| Stack (Next.js, Supabase, sécurité, Tailwind) | `.claude/rules/stack.md` |
| Style de code | `.claude/rules/coding-style.md` |
| Workflow git | `.claude/rules/git-workflow.md` |

---

## Documentation (post-merge dans main uniquement)

- `SESSION.md` — résumé session, tickets complétés
- `DEVLOG.md` — contexte, root causes, solutions
- `CHANGELOG.md` — si fonctionnalité user-facing
- `ARCHITECTURE.md` — si décision technique majeure
