# SESSION.md — Contexte de la session en cours

> Ce fichier est réécrit à la fin de chaque session par l'agent tech-lead pour préparer la suivante.
> Il contient uniquement ce dont l'agent a besoin pour travailler MAINTENANT.
> Historique complet → voir DEVLOG.md

---

## Session 6 — US-001 + US-002 + FIX-#44

### Objectif de la session

Implémenter les deux premières user stories du chemin critique MVP :
- **FIX-#44** : corriger `npm run lint` (bloque les pré-checks de l'agent test)
- **US-001 (#12)** : Ajouter une position manuellement
- **US-002 (#13)** : Voir la liste des positions

### État des tickets

| Ticket | Titre | Statut |
|--------|-------|--------|
| #44 FIX | Corriger `npm run lint` (Next.js 16) | 🔴 À faire en premier |
| #12 US-001 | Ajouter une position manuellement | 🔴 À faire |
| #13 US-002 | Voir la liste des positions | 🔴 À faire après US-001 |

---

## Contexte technique

### Ce qui est déjà en place

- ✅ Auth Supabase (TASK-006) — flux de connexion fonctionnel
- ✅ API Routes prix temps réel (TASK-043, commit `2c44e3f`) :
  - `/api/quote?symbol=AAPL` → Finnhub (stocks/ETF)
  - `/api/quote?symbol=bitcoin` → CoinGecko (crypto)
  - `/api/exchange-rate?from=USD&to=EUR` → Frankfurter
- ✅ Schéma DB Supabase local — table `positions` existante

### Chemin critique MVP (rappel)

```
✅ TASK-006 Auth
✅ #43 API Routes prix (Finnhub + CoinGecko + Frankfurter)
→ #44 FIX lint          ← session 6 (débloque agent test)
→ US-001 (#12)          ← session 6
→ US-002 (#13)          ← session 6
→ US-005 (#16) Rafraîchir les prix
→ US-006 (#17) Vue Global
→ #41 Supabase prod + #26 TASK-008 Vercel deploy
```

---

## Instructions pour la session

### FIX-#44 — Corriger npm run lint

`next lint` a été supprimé en Next.js 16. Remplacer dans `package.json` :
```json
"lint": "npx eslint src --ext .ts,.tsx"
```

### US-001 — Ajouter une position manuellement

Formulaire de saisie + insert Supabase.
Champs : ticker, type (stock/crypto/etf), quantité, PRU, enveloppe, devise.

**Ordre :** FIX-#44 d'abord → tester avec `/api/quote` → puis formulaire.

### US-002 — Voir la liste des positions

Tableau des positions avec données Supabase.
Colonnes : ticker, quantité, PRU, prix actuel, valeur, P&L, P&L%.

**Seed data :** créer 3-4 positions de test via US-001 avant de développer US-002.

---

## Ce qu'il ne faut PAS faire en session 6

- Ne pas commencer US-005 (rafraîchir les prix) — session 7
- Ne pas toucher au déploiement Vercel
- Ne pas modifier le schéma DB

---

*Dernière mise à jour : fin Session 5 — 20/03/2026*
