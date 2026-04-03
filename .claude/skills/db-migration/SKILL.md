---
name: db-migration
description: "Workflow de migration Supabase. Déclencher quand un changement de schéma DB est nécessaire."
agent: dev-agent
context: fork
metadata:
  version: "1.0"
---

# Database Migration Workflow — Supabase

## Quand utiliser
- Nouveau modèle de données (table, colonne, index)
- Modification de schéma existant
- Changement de RLS policies

## Pré-requis
- Validation PO obligatoire avant toute migration
- Supabase Docker local doit tourner (`docker ps | grep supabase`)

## Étapes

### 1. Planification
- Identifier les changements de schéma nécessaires
- Lire les migrations existantes : `ls supabase/migrations/`
- Vérifier `src/types/database.ts` pour l'état actuel

### 2. Création migration
```bash
npx supabase migration new <nom_descriptif>
```
- Écrire le SQL dans le fichier créé
- Inclure les RLS policies si nouvelle table
- Inclure les index si requêtes fréquentes

### 3. Application locale
```bash
npx supabase migration up --local
```

### 4. Regénération types
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

### 5. Vérification
- `npx tsc --noEmit` — les types doivent compiler
- Vérifier que les composants utilisant les tables modifiées fonctionnent
- Ne jamais modifier manuellement `src/types/database.ts`

## Règles
- Ne JAMAIS modifier une migration existante
- Ne JAMAIS appliquer en production sans validation PO
- Toujours tester en local d'abord
