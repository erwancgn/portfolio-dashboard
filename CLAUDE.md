# CLAUDE.md — Portfolio Dashboard

> Application Next.js 16 + React 19 de suivi de portefeuille financier personnel.
> Stack : Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase · Vercel

---

## Règles absolues

- Ne jamais lire/exposer `.env.local` ou credentials
- Ne jamais `git push` sans validation PO
- Ne jamais modifier la DB de production
- Toujours lire un fichier avant de le modifier
- Agents modifient directement, expliquent après — validation PO en fin de tâche

---

## Navigation agent-centric

| Besoin | Où chercher |
|--------|------------|
| Conventions code | `.claude/rules/coding-style.md` |
| Workflow git | `.claude/rules/git-workflow.md` |
| Sécurité | `.claude/rules/security.md` |
| Protocole agents | `.claude/rules/agent-protocol.md` |
| Next.js 16 | `.claude/rules/nextjs.md` |
| Supabase | `.claude/rules/supabase.md` |
| Tailwind v4 | `.claude/rules/tailwind.md` |
| Agents | `.claude/agents/` |
| Skills/Workflows | `.claude/skills/` · `.claude/workflows/` |
| Templates artifacts | `.claude/templates/` |
| Checklists validation | `.claude/checklists/` |
| Données persistantes | `.claude/data/` |

---

## Workflow BMAD

PO exprime un besoin → [analyst] comprend et produit un brief → [pm] transforme en PRD / epics → [architect] valide l'approche technique → [sm] découpe en stories → [dev-agent] implémente (worktree isolé) → [code-reviewer] review pre-commit → [test-agent] vérifie AC + régressions → PO valide → commit

---

## Documentation (post-merge dans main uniquement)

- `SESSION.md` — résumé session, tickets complétés
- `DEVLOG.md` — contexte, root causes, solutions
- `CHANGELOG.md` — si fonctionnalité user-facing
- `ARCHITECTURE.md` — si décision technique majeure
