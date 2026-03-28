# Rapport QA — Session 11 : atomicité achat, vente, historique

Date : 2026-03-28
Branche : main
Modèle : claude-sonnet-4-6

---

## Résultat global : 16/17 critères PASSES — 1 ANOMALIE NON-BLOQUANTE

---

## 1. Atomicité achat

### PATCH /api/positions/[id] appelle la RPC `buy_position`
PASSE.
`src/app/api/positions/[id]/route.ts` ligne 67 : `await supabase.rpc('buy_position', { ... })`.
Aucune requête UPDATE/INSERT séparée n'existe dans ce handler.

### RPC `buy_position` présente dans la migration
PASSE.
`supabase/migrations/20260328000001_buy_sell_rpcs.sql` lignes 5-39 : `CREATE OR REPLACE FUNCTION buy_position(...)`.

### Vérification de la formule DCA
PASSE.
Ligne 28 de la migration :
```sql
v_new_pru := (v_old_qty * v_old_pru + p_quantity * p_price) / v_new_qty;
```
Conforme à la formule CLAUDE.md :
`Nouveau PRU = (ancienne_quantité × ancien_pru + montant) / (ancienne_quantité + quantité_achetée)`
où `montant = p_quantity * p_price`.

---

## 2. Vente

### RPC `sell_position` présente dans la migration
PASSE.
`supabase/migrations/20260328000001_buy_sell_rpcs.sql` lignes 41-77.

### Vente partielle (UPDATE) et vente totale (DELETE)
PASSE.
- Vente totale (`p_quantity = v_old_qty`) → `DELETE FROM positions` (ligne 68).
- Vente partielle → `UPDATE positions SET quantity = v_old_qty - p_quantity` (ligne 71).

### Protection surquantité (RAISE EXCEPTION)
PASSE.
Lignes 60-62 :
```sql
IF p_quantity > v_old_qty THEN
  RAISE EXCEPTION 'Quantité vendue supérieure à la quantité détenue';
END IF;
```

### Endpoint POST /api/positions/[id]/sell existe et appelle la RPC
PASSE.
`src/app/api/positions/[id]/sell/route.ts` ligne 63 : `await supabase.rpc('sell_position', { ... })`.

### SellButton.tsx existe avec prop `maxQuantity`
PASSE.
`src/components/positions/SellButton.tsx` ligne 10 : `maxQuantity: number` dans l'interface `SellButtonProps`.

### PositionsTable utilise SellButton et non DeletePositionButton
PASSE.
- Import de `SellButton` présent ligne 5 de `PositionsTable.tsx`.
- Import de `DeletePositionButton` : absent du fichier.
- Utilisation ligne 127 : `<SellButton id={pos.id} ticker={pos.ticker} maxQuantity={pos.quantity} />`.

NOTE NON-BLOQUANTE : le fichier `src/components/positions/DeletePositionButton.tsx` existe encore
dans le projet mais n'est plus importé ni utilisé nulle part. Il peut être supprimé lors d'un
chantier de nettoyage.

---

## 3. Popup erreur via Dialog shadcn/ui

### AddBuyButton.tsx
PASSE.
- Import ligne 5 : `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'`
- Rendu lignes 130-145 : `<Dialog open={errorMsg !== null} ...>`.

### SellButton.tsx
PASSE.
- Import ligne 5 : `import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'`
- Rendu lignes 138-153 : `<Dialog open={errorMsg !== null} ...>`.

---

## 4. Page Historique

### Page /dashboard/historique/page.tsx existe
PASSE.
Fichier présent à `src/app/dashboard/historique/page.tsx` (41 lignes).

### Composant TransactionsTable avec filtres date
PASSE.
`src/components/transactions/TransactionsTable.tsx` (127 lignes).
Filtres `dateFrom` et `dateTo` implémentés via `useState` et `useMemo` (lignes 34-44).
Bouton "Réinitialiser" conditionnel présent.

### Lien "Historique" dans dashboard/page.tsx
PASSE.
`src/app/dashboard/page.tsx` lignes 33-38 :
```tsx
<Link href="/dashboard/historique" ...>
  Historique
</Link>
```

---

## 5. Qualité

### npx tsc --noEmit → 0 erreur
PASSE. Aucune erreur TypeScript.

### Aucun fichier dépasse 200 lignes
PASSE. Tous les fichiers concernés sont sous le seuil :
| Fichier | Lignes |
|---|---|
| buy_sell_rpcs.sql | 77 |
| route.ts (PATCH/DELETE) | 131 |
| sell/route.ts | 78 |
| AddBuyButton.tsx | 148 |
| SellButton.tsx | 156 |
| PositionsTable.tsx | 137 |
| historique/page.tsx | 41 |
| TransactionsTable.tsx | 127 |
| dashboard/page.tsx | 59 |

### Aucun `style={{}}` inline
PASSE. Grep sur tous les .tsx : aucun résultat.

---

## Récapitulatif

| Critère | Statut |
|---|---|
| PATCH appelle buy_position | PASSE |
| RPC buy_position dans migration | PASSE |
| Formule DCA conforme CLAUDE.md | PASSE |
| RPC sell_position dans migration | PASSE |
| Vente partielle (UPDATE) | PASSE |
| Vente totale (DELETE) | PASSE |
| RAISE EXCEPTION surquantité | PASSE |
| POST /api/positions/[id]/sell appelle RPC | PASSE |
| SellButton prop maxQuantity | PASSE |
| PositionsTable utilise SellButton | PASSE |
| AddBuyButton Dialog shadcn/ui | PASSE |
| SellButton Dialog shadcn/ui | PASSE |
| Page historique existe | PASSE |
| TransactionsTable avec filtres date | PASSE |
| Lien Historique dans dashboard | PASSE |
| tsc --noEmit 0 erreur | PASSE |
| Aucun fichier > 200 lignes | PASSE |
| Aucun style inline | PASSE |

**Anomalie non-bloquante :**
- `src/components/positions/DeletePositionButton.tsx` : fichier orphelin non supprimé.
  Aucun import actif. Peut être retiré lors d'un prochain chantier de nettoyage.

