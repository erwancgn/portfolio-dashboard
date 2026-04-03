# Source Tree — Portfolio Dashboard

## Structure principale
src/
├── app/                    # Pages et API routes (App Router)
│   ├── api/               # Route handlers (server-side)
│   ├── dashboard/         # Page principale portfolio
│   ├── positions/         # Détail positions
│   ├── dividends/         # Calendrier dividendes
│   ├── reports/           # Rapports fiscaux
│   └── layout.tsx         # Layout racine
├── components/            # Composants React (PascalCase)
├── lib/                   # Utilitaires et helpers (camelCase)
│   ├── supabase/         # Clients Supabase (browser/server)
│   └── ...               # Format, calculs, API wrappers
└── types/                 # Types TypeScript
    └── database.ts       # Auto-généré par Supabase CLI

supabase/
├── migrations/            # Migrations SQL (ne pas modifier les existantes)
└── config.toml           # Config Supabase locale

## Fichiers racine clés
- CLAUDE.md               # Instructions Claude Code (lean, navigation)
- SESSION.md              # Contexte session courante
- DEVLOG.md              # Journal de développement
- ARCHITECTURE.md        # Décisions d'architecture (ADR)
- LESSONS.md             # Erreurs passées et règles apprises
- CHANGELOG.md           # Changelog user-facing
