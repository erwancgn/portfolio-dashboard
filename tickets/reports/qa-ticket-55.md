# Rapport QA — Ticket #55 : Liquidités + fiscalité + apports

Date : 2026-03-28
Auditeur : QA Agent (claude-sonnet-4-6)
Statut global : PASSE avec 1 observation non bloquante

---

## Base de données

| Critère | Statut | Détail |
|---|---|---|
| Migration `20260328000002_liquidities.sql` présente | PASSE | fichier présent dans supabase/migrations/ |
| Migration appliquée en local | PASSE | REST API locale répond sans erreur sur liquidities et transactions.tax_amount |
| Table liquidities : colonnes user_id, envelope, amount, updated_at | PASSE | Toutes présentes dans la migration SQL et dans database.ts |
| Contrainte UNIQUE(user_id, envelope) | PASSE | Déclarée ligne 16 de la migration |
| Colonne tax_amount ajoutée à transactions | PASSE | ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0 |
| Contrainte type mise à jour : buy/sell/deposit/withdraw | PASSE | Contrainte transactions_type_check recréée avec 4 valeurs |
| RLS activé sur liquidities | PASSE | ENABLE ROW LEVEL SECURITY + 3 policies SELECT/INSERT/UPDATE |
| RPC buy_position déduit des liquidités | PASSE | amount - v_total via ON CONFLICT DO UPDATE |
| RPC sell_position calcule tax 30% (0% PEA), crédite net | PASSE | v_gain * 0.30 si non-PEA, v_net = price*qty - tax, crédité dans liquidités |
| RPC deposit_liquidity existe | PASSE | Déclarée lignes 121-147, valide les types deposit/withdraw |

---

## SellButton

| Critère | Statut | Détail |
|---|---|---|
| Props pru et envelope présentes | PASSE | interface SellButtonProps ligne 7-13 |
| Prévisualisation P&L en temps réel | PASSE | Calcul inline lignes 121-143 |
| Prévisualisation taxe en temps réel | PASSE | Math.max(0, gain) * 0.30 si non-PEA |
| Prévisualisation net en temps réel | PASSE | price * qty - tax |
| Cohérence calculs avec CLAUDE.md | PASSE | gain = (price - pru) * qty conforme à la formule de référence |
| PEA exonéré affiché | PASSE | Badge PEA — exonéré affiché |

---

## API /api/liquidities

| Critère | Statut | Détail |
|---|---|---|
| POST /api/liquidities existe | PASSE | Handler POST exporté |
| Appelle RPC deposit_liquidity | PASSE | supabase.rpc deposit_liquidity ligne 36 |
| Authentification vérifiée | PASSE | auth.getUser() avec retour 401 si absent |
| Validation des paramètres | PASSE | Vérifie envelope, amount, type avant appel RPC |
| Signe le montant selon deposit/withdraw | PASSE | signedAmount ligne 34 |

---

## Dashboard

| Critère | Statut | Détail |
|---|---|---|
| LiquidityWidget importé et présent | PASSE | Import ligne 8, rendu ligne 46 |
| DepositButton présent via LiquidityWidget | PASSE | DepositButton rendu dans LiquidityWidget ligne 44 |
| LiquidityWidget affiche total + PEA + Autre | PASSE | 3 blocs : total, PEA, CTO/Autre |
| SellButton reçoit pru et envelope | PASSE | PositionsTableView.tsx ligne 70 |

---

## Historique

| Critère | Statut | Détail |
|---|---|---|
| Query inclut tax_amount | PASSE | historique/page.tsx ligne 20 sélectionne tax_amount explicitement |
| Colonne Taxe dans TransactionsTable | PASSE | TableHead Taxe ligne 96 |
| Interface Transaction inclut tax_amount | PASSE | Ligne 22 de TransactionsTable.tsx |
| Badge deposit Apport présent | PASSE | Lignes 119-123 |
| Badge withdraw Retrait présent | PASSE | Lignes 124-128 |
| Affichage conditionnel taxe | PASSE | t.tax_amount > 0 ? formatEur : — ligne 134 |

---

## Qualité

| Critère | Statut | Détail |
|---|---|---|
| npx tsc --noEmit | PASSE | 0 erreur TypeScript |
| Aucun style={{}} | PASSE | Aucune occurrence dans les .tsx du projet |
| Fichiers ticket <= 200 lignes | PASSE | Max : SellButton 182, TransactionsTable 143 |
| database.ts > 200 lignes | OBSERVATION | 489 lignes — fichier généré Supabase, déjà à 418 lignes avant ce ticket |

---

## Observations non bloquantes

### OBS-01 — database.ts dépasse 200 lignes
Fichier src/types/database.ts (489 lignes). Ce fichier est généré par supabase gen types.
Il était déjà à 418 lignes avant ce ticket. La convention 200 lignes ne sapplique pas aux fichiers générés.
Recommandation : documenter lexception dans CLAUDE.md.

### OBS-02 — RPCs non typées dans database.ts
Le bloc Functions dans database.ts est vide. Les 3 nouvelles RPCs ne bénéficient pas du typage fort.
Impact : pas derreur TypeScript, mais appels rpc() sans autocompletion.
Recommandation : regénérer database.ts via npx supabase gen types typescript après validation.

### OBS-03 — Migrations non appliquées en remote
Les 3 dernières migrations ne sont pas sur la remote (Supabase prod). Conforme au workflow CLAUDE.md.
La migration prod sera à déclencher lors du déploiement Vercel.

---

## Conclusion

Tous les criteres dacceptation du ticket #55 sont satisfaits. Le ticket peut etre valide par le PO.
