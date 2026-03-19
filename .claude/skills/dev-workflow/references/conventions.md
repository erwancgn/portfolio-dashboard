# Conventions Projet — Portfolio Dashboard

## Source de vérité

| Donnée | Fichier source | Règle |
|--------|---------------|-------|
| Schéma DB | `src/types/database.ts` | Généré automatiquement, ne jamais modifier |
| Migrations | `supabase/migrations/*.sql` | Ne jamais modifier un fichier existant |
| Formules financières | `CLAUDE.md` section "Calculs financiers" | Implémenter dans `src/lib/`, jamais dupliquer |
| Règles de style | `CLAUDE.md` section "Conventions de code" | Toujours respecter |
| Décisions d'archi | `ARCHITECTURE.md` | Consulter avant tout choix technique |

## Structure du projet
```
src/
├── app/                    # App Router Next.js 16
│   ├── api/               # Routes API (server-side uniquement)
│   ├── auth/
│   │   ├── login/page.tsx # Page de login
│   │   └── callback/route.ts # (à créer) OAuth callback
│   ├── dashboard/         # (à créer) Page principale
│   ├── layout.tsx         # Layout racine
│   └── page.tsx           # Page d'accueil
├── components/            # Composants réutilisables
├── lib/
│   └── supabase/
│       ├── client.ts      # Client browser Supabase
│       └── server.ts      # Client server Supabase
├── types/
│   └── database.ts        # Types auto-générés (ne pas toucher)
└── proxy.ts               # Auth proxy (ex-middleware.ts)
```

## Patterns récurrents

### Nouveau composant Server
```tsx
// src/app/xxx/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function XxxPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('table').select()
  // ...
}
```

### Nouveau composant Client
```tsx
// src/components/XxxButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function XxxButton() {
  const supabase = createClient()
  // useState, onClick, etc.
}
```

### Nouvelle API Route
```tsx
// src/app/api/xxx/route.ts
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // logique
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

## APIs externes

| API | Usage | Clé | Rate limit |
|-----|-------|-----|------------|
| Finnhub | Prix actions | `FINNHUB_API_KEY` (server only) | 60 req/min |
| CoinGecko | Prix crypto | Gratuit sans clé | 30 req/min |
| Frankfurter | Taux de change | Aucune clé | Illimité |
