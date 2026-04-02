# SESSION.md — Suivi sessions actives

> Format ultra-compact pour économiser les tokens de contexte.
> Historique complet → DEVLOG.md

---

## Session 19 — À venir

| Ticket | Titre | Priorité |
|--------|-------|----------|
| #71 | Calendrier des dividendes | P1 |
| #74 | Fair Value — valeur intrinsèque estimée (page dédiée) | P1 |
| #75 | Rapport fiscal — imposition et déclaration annuelle | P3 |

**Backlog non-bloquant** : Refactor route.ts + ClassicAnalysis.tsx (dépassement 200L limite)

---

## Stack en place

- Auth Supabase ✅ · FMP API ✅ (quote, key-metrics, income-statement, profile)
- Gemini 2.5 Flash ✅ · Agents Buffett/Lynch ✅
- `AllocationChart` (Recharts donut) ✅ · `PortfolioSummary` hero ✅
- Transactions atomiques (RPCs PostgreSQL) ✅ · Historique transactions ✅
- Fiscalité flat tax 30% CTO/Crypto, 0% PEA ✅ · Thème light ✅
- DCA : table + route + UI ✅ · Responsive mobile ✅
- Production : https://portfolio-zeta-fawn-73.vercel.app ✅

---

## Fichiers clés

```
src/app/dashboard/page.tsx
src/app/api/analyse/classic/route.ts           ← Buffett/Lynch avec FMP
src/lib/fmp-financials.ts                      ← Fetche quote/metrics/income FMP
src/lib/fmp.ts                                 ← fetchFmpProfile
src/agents/buffett-analyse.md                  ← Value investing (moat, MoS)
src/agents/lynch-analyse.md                    ← Growth investing (PEG, story)
src/types/database.ts                          ← Types générés Supabase
```

---

*Mis à jour : Session 18 — 02/04/2026*
