# Rapport QA — Ticket #47 — Table transactions
Date : 2026-03-28
Branche : main
Vérificateur : QA agent (claude-sonnet-4-6)

---

## Résultat global : PASSE avec 1 avertissement

---

## Critères d'acceptation

### [PASSE] Migration SQL créée

Fichier : supabase/migrations/20260328000000_create_transactions.sql
Le fichier existe et est le dernier fichier de migration en date.

### [PASSE] Migration appliquée en local

La table /transactions est exposée par PostgREST sur http://127.0.0.1:54321/rest/v1/ avec toutes les colonnes attendues. La migration a bien été appliquée sur la base locale Docker.

### [PASSE] Colonnes de la table transactions

Toutes les colonnes du ticket sont présentes et cohérentes entre la migration et database.ts :
id (uuid PK), user_id (FK auth.users NOT NULL), position_id (FK positions nullable),
ticker (text NOT NULL), type (text CHECK IN buy/sell), quantity, price, total, executed_at (timestamptz DEFAULT now()).

### [PASSE] PATCH /api/positions/[id] insère une transaction à chaque achat DCA

Lignes 102-113 de src/app/api/positions/[id]/route.ts : INSERT correct après chaque calcul de PRU.
Champs insérés : user_id, position_id, ticker, type=buy, quantity, price, total=quantity*purchasePrice.
Formule total conforme à CLAUDE.md (Valeur investie = quantité x pru).

### [PASSE] RLS activé sur la table

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY est présent dans la migration.
Deux politiques définies : transactions_select_own (SELECT) et transactions_insert_own (INSERT),
toutes deux filtrées sur auth.uid() = user_id.

---

## Avertissement non-bloquant

### Insertion transaction non-atomique

Fichier : src/app/api/positions/[id]/route.ts, lignes 101-113.
Le commentaire dans le code indique explicitement que l'insertion est non-bloquante et
qu'une erreur n'entraîne pas de rollback du PRU.
Conséquence : si l'INSERT transactions échoue, le PRU est mis à jour mais aucune transaction
n'est tracée, sans erreur retournée au client.
Ce n'est pas un bloquant pour le ticket tel que rédigé.
Le PO doit décider si ce comportement est acceptable pour le MVP.

---

## Vérifications complémentaires

TypeScript : npx tsc --noEmit — aucune erreur.
Longueur fichier route.ts : 165 lignes, conforme à la limite de 200 (CLAUDE.md).
Nommage : conforme (kebab-case fichier, camelCase variables, JSDoc sur PATCH et DELETE).

---

## Conclusion

Les 4 critères d'acceptation du ticket #47 sont remplis.
1 avertissement non-bloquant sur le comportement non-atomique de l'insertion de transaction.
