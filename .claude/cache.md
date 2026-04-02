# Cache Session — Constantes réutilisables

> Ce fichier est relu à chaque session pour éviter de relire DEVLOG/CHANGELOG.
> À jour chaque fin de session.

---

## Stack technique (jamais relis)

- **Framework** : Next.js 16 + React 19 + TypeScript 6
- **Styling** : Tailwind CSS v4 + CSS variables (`var(--color-*)`)
- **Backend** : Supabase (PostgreSQL + Auth magic link + RLS)
- **IA** : Gemini 2.5 Flash (quote 2M input, 8k output)
- **APIs externes** : FMP (quote, key-metrics, income-statement, profile) + Yahoo Finance (chart)
- **DB** : `positions`, `transactions`, `liquidities`, `dca_rules`, `classic_analysis_cache` (7j TTL)

---

## Endpoints API key

### FMP (`src/lib/fmp.ts`, `src/lib/fmp-financials.ts`)
- `/stable/quote?symbol=` → prix temps réel + P/E + EPS
- `/stable/key-metrics?symbol=&limit=5` → ROIC, FCF, dette, ratio, couverture intérêts
- `/stable/income-statement?symbol=&limit=5` → CA, marges, EPS (5 ans historique)
- `/stable/profile?symbol=` → secteur, industrie, pays, logo, ISIN

### Yahoo Finance (`src/lib/yahoo.ts`)
- `/v8/finance/chart/{ticker}?interval=1d&range=1d` → prix + devise + nom + ISIN
- Fallback si FMP indisponible

### Gemini 2.5 Flash
- Model : `gemini-2.5-flash`
- System instruction : injected via `systemInstruction` parameter
- JSON extraction : regex non-greedy `\{[\s\S]*?\}` (dernier match = final)

---

## Agents IA (prompts)

| Agent | Fichier | Utilisation |
|-------|---------|-------------|
| **Buffett (value)** | `src/agents/buffett-analyse.md` | `/api/analyse/classic?method=buffett` |
| **Lynch (growth)** | `src/agents/lynch-analyse.md` | `/api/analyse/classic?method=lynch` |
| **Quick Analysis** | `src/agents/quick-analyse.md` | Search web (Quick Analysis composant) |

**Placeholders injectés** :
- `{ticker}` → symbole boursier
- `{financial_data}` → bloc markdown FMP formaté (quote + métriques + historique)
- `{context}` → contexte additionnel (Quick Analysis)

---

## Conventions code (CLAUDE.md)

- **Composants** : `PascalCase.tsx` (ex: `AllocationChart.tsx`)
- **Helpers** : `kebab-case.ts` (ex: `fmp-financials.ts`)
- **Styling** : Tailwind + CSS variables, **zéro** `style={{}}` sauf valeurs dynamiques
- **Limite fichiers** : 200 lignes max (exception : `database.ts` généré)
- **Imports** : jamais de `.env.local` côté client, secrets = serveur only
- **Commits** : conventional (feat:, fix:, docs:, chore:, test:)

---

## Fichiers à ignorer (jamais modifier)

- `src/types/database.ts` → généré par `supabase gen types typescript --local`
- `DEVLOG_ARCHIVE.md` → historique S1-S17, lecture à la demande uniquement
- `.env.local` → secrets locaux, jamais versionné

---

## Sessions strategy

### Workflow S19+

1. **Phase 0** : Choisir le modèle minimal
   - Simple (1-2 fichiers, bug évident) → Haiku 4.5 (10× moins cher)
   - Standard (3-5 fichiers, feature normale) → Sonnet 4.6 (défaut)
   - Complexe (archi, multi-système) → Opus 4.6
   - IA/Prompts (agents, skills) → Opus 4.6

2. **Agents obligatoires par phase** (à appeler en parallèle si indépendant)
   - Exploration multi-fichiers → `Explore` agent (-20% tokens)
   - Implémentation → `dev-agent` (-30% tokens)
   - Design/UX → `ux-agent` si composant (-20% tokens)
   - **Validation → `test-agent` TOUJOURS** (acceptance criteria + regressions)
   - Architecture → `tech-lead` si décision technique (-15% tokens)

3. **Context management**
   - `/compact` ou `/clear` entre sessions pour reset
   - Ne relit jamais DEVLOG/CHANGELOG en entier (utiliser cache.md)
   - `Grep + Read ciblé` au lieu d'Explore large

4. **Règle ferme**
   - 1 feature = 1 session maximum
   - Pas d'exceptions (économies 50-70% tokens par feature)

---

*Mis à jour : S18 (02/04/2026)*
