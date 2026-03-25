# Rapport QA — US-004 Supprimer une position (#15)

Date : 2026-03-25
Auditeur : QA Agent (claude-sonnet-4-6)
Branche : main — commit 8035d60

---

## Fichiers audités

- `src/app/api/positions/[id]/route.ts` — 57 lignes
- `src/components/positions/DeletePositionButton.tsx` — 52 lignes
- `src/components/positions/PositionsTable.tsx` — 128 lignes

---

## Résultats par critère

### CA-1 — Bouton supprimer visible sur chaque ligne (colonne Actions dans PositionsTable)
STATUT : PASS

`PositionsTable.tsx` déclare bien une colonne « Actions » dans le `<thead>` (ligne 76).
Chaque ligne du `<tbody>` instancie `<DeletePositionButton id={pos.id} ticker={pos.ticker} />` dans
une cellule `<td>` (ligne 118-120). Le composant rend le texte « Supprimer » par défaut.

---

### CA-2 — Confirmation demandée avant suppression
STATUT : PASS

`DeletePositionButton.tsx` ligne 21 :
```
const confirmed = window.confirm(`Supprimer la position ${ticker} ?`)
if (!confirmed) return
```
La suppression ne démarre pas si l'utilisateur annule. L'implémentation utilise `window.confirm`,
explicitement autorisée par le critère.

---

### CA-3 — Suppression effective via API DELETE — RLS respecté (user_id vérifié)
STATUT : PASS

`route.ts` effectue deux protections en cascade :
1. Authentification Supabase côté serveur via `supabase.auth.getUser()` — retourne 401 si absent.
2. Filtre `.eq('user_id', user.id)` sur la requête DELETE (ligne 40) — conforme à la convention
   de double protection RLS décrite dans CLAUDE.md.

Le comptage `{ count: 'exact' }` permet de distinguer un enregistrement non trouvé (404) d'une
erreur DB (500).

---

### CA-4 — `router.refresh()` appelé après suppression réussie
STATUT : PASS

`DeletePositionButton.tsx` lignes 28-31 :
```
if (res.status === 204) {
  router.refresh()
  return
}
```
`router.refresh()` est conditionné au statut HTTP 204, en parfaite correspondance avec le code
retour de l'API.

---

### CA-5 — État loading pendant l'appel (bouton désactivé)
STATUT : PASS

`useState(false)` initialisé ligne 18. `setLoading(true)` avant le `fetch` (ligne 24).
`setLoading(false)` dans le bloc `finally` (ligne 37) — garanti même en cas d'exception réseau.
L'attribut `disabled={loading}` est positionné sur le `<button>` (ligne 45).

---

### CA-6 — Pas de `style={{}}` inline, pas de `any`, TypeScript strict
STATUT : PASS

Recherche `style=\{\{` sur tous les `.tsx` du répertoire `src/` : aucun résultat.
Recherche `: any` dans `src/components/positions/` : aucun résultat.
Les types sont explicites : `DeletePositionButtonProps`, `ErrorResponse`, `PositionWithPrice`.
Le cast ligne 33 de DeletePositionButton (`as { error?: string }`) est typé — pas d'usage de `any`.

---

### CA-7 — Aucun fichier dépasse 200 lignes
STATUT : PASS

- `route.ts` : 57 lignes
- `DeletePositionButton.tsx` : 52 lignes
- `PositionsTable.tsx` : 128 lignes

Tous les trois sont en dessous de la limite de 200 lignes fixée dans CLAUDE.md.

---

### Vérification TypeScript (`npx tsc --noEmit`)
STATUT : PASS

Aucune erreur de compilation. Sortie vide.

---

## Observations complémentaires (non bloquantes)

1. **Retour utilisateur silencieux en cas d'erreur API** — les erreurs 4xx/5xx sont uniquement
   loguées en `console.error`. L'utilisateur ne reçoit aucun message visible (toast, alerte).
   Ce point n'est pas dans les critères d'acceptation de US-004 mais constitue un risque UX
   à documenter pour un ticket futur.

2. **Pas de gestion du cas `count === null`** — la route vérifie `count === 0` mais pas
   `count === null`. Supabase peut retourner `null` pour le count en certaines conditions. Le
   comportement serait alors une réponse 204 même sans suppression réelle. Risque faible car
   la requête `delete({ count: 'exact' })` est explicite, mais à surveiller.

3. **Label visuel du bouton en état loading** — le bouton affiche `'...'` pendant le chargement.
   Fonctionnel mais peu explicite. Hors périmètre US-004.

---

## Verdict final

TOUS LES CRITÈRES D'ACCEPTATION SONT SATISFAITS (7/7).
Compilation TypeScript sans erreur.
US-004 est prêt pour validation PO.
