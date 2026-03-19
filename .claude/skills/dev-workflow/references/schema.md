# Schéma Supabase — Portfolio Dashboard

> Source de vérité pour les types : `src/types/database.ts` (auto-généré)
> Source de vérité pour les migrations : `supabase/migrations/`
> Ce fichier est un résumé lisible pour l'agent dev. En cas de doute, vérifier les fichiers sources.

## Tables

### positions
Une ligne = un titre dans le portfolio.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| ticker | text | non | — | Symbole boursier (ex: NVDA) |
| name | text | oui | — | Nom complet du titre |
| isin | text | oui | — | Code ISIN |
| quantity | numeric | non | 0 | Nombre de parts |
| pru | numeric | non | 0 | Prix de Revient Unitaire |
| current_price | numeric | oui | 0 | Dernier prix connu |
| currency | text | oui | 'EUR' | Devise native du titre |
| envelope | text | oui | — | PEA / CTO / Crypto / PEA-PME |
| sector | text | oui | — | Secteur d'activité |
| country | text | oui | — | Pays du siège |
| created_at | timestamptz | oui | `now()` | Date de création |
| updated_at | timestamptz | oui | `now()` | Dernière modification |

### portfolio_snapshots
Une photo du portfolio chaque jour.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| date | date | non | — | Date du snapshot |
| total_value | numeric | oui | — | Valeur totale du portfolio |
| total_invested | numeric | oui | — | Total investi |
| total_pnl | numeric | oui | — | P&L total |
| positions_json | jsonb | oui | — | Copie des positions ce jour-là |

Contrainte : `UNIQUE(user_id, date)` — 1 snapshot par user par jour.

### price_alerts
Notification si un titre passe au-dessus/dessous d'un seuil.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| ticker | text | non | — | Symbole boursier |
| type | text | non | — | `'above'` ou `'below'` |
| threshold | numeric | non | — | Seuil de déclenchement |
| is_active | boolean | oui | true | Alerte active ou non |
| triggered_at | timestamptz | oui | — | Date de déclenchement |
| created_at | timestamptz | oui | `now()` | Date de création |

### dca_rules
Stratégie d'investissement régulier par titre.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| position_id | uuid | oui | — | FK `positions` |
| ticker | text | non | — | Symbole boursier |
| amount | numeric | non | — | Montant en € par passage |
| frequency | text | non | — | `'weekly'`/`'monthly'`/`'quarterly'`/`'biannual'` |
| is_active | boolean | oui | true | Règle active ou non |
| last_executed_at | timestamptz | oui | — | Dernier passage |
| next_expected_at | timestamptz | oui | — | Prochain passage prévu |
| created_at | timestamptz | oui | `now()` | Date de création |
| updated_at | timestamptz | oui | `now()` | Dernière modification |

### dca_executions
Historique de chaque passage DCA.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| dca_rule_id | uuid | oui | — | FK `dca_rules` |
| ticker | text | non | — | Symbole boursier |
| amount | numeric | non | — | Montant investi |
| execution_price | numeric | non | — | Prix d'exécution |
| quantity_bought | numeric | non | — | `amount / execution_price` |
| new_pru | numeric | non | — | PRU recalculé après ce DCA |
| executed_at | timestamptz | oui | `now()` | Date d'exécution |

### agent_reports
Historique des analyses générées par les agents IA.

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| id | uuid | non | `gen_random_uuid()` | PK |
| user_id | uuid | non | — | FK `auth.users` |
| type | text | non | — | `'newsletter'`/`'surveillance'`/`'chat'` |
| content | text | oui | — | Contenu du rapport |
| model | text | oui | — | `'claude-haiku'`/`'claude-sonnet'` |
| created_at | timestamptz | oui | `now()` | Date de création |

## Sécurité (RLS)

Toutes les tables ont RLS activé. Policy identique partout :
```sql
USING (auth.uid() = user_id)
```
Chaque utilisateur ne voit que ses propres données.

## Index

| Index | Table | Colonnes | Usage |
|-------|-------|----------|-------|
| `idx_positions_user` | positions | user_id | Toutes les positions d'un user |
| `idx_snapshots_user_date` | portfolio_snapshots | user_id, date | Snapshot d'un user à une date |
| `idx_dca_rules_user` | dca_rules | user_id | Règles DCA d'un user |
| `idx_dca_exec_user` | dca_executions | user_id | Historique DCA d'un user |
