# QA Report — Ticket #71 : Calendrier des dividendes

**Date :** 2026-04-02
**Branche vérifiée :** `main`
**Verdict global : PASS après correctifs**

---

## Critères d'acceptation

| # | Critère | Statut | Notes |
|---|---------|--------|-------|
| 1 | Page `/dashboard/dividendes` — fichier `src/app/dashboard/dividendes/page.tsx` | PASS | États `loading/error/success` + warning de chargement partiel |
| 2 | Route API `src/app/api/dividends/route.ts` — auth Supabase + fetch FMP + calcul YoC | PASS | Auth `supabase.auth.getUser()`, YoC conservé, warnings renvoyés pour les tickers limités |
| 3 | `DividendCalendar.tsx` — vue liste mois/mois + onglets Prochains/Historique | PASS | Calendrier par mois, montants en devise native, agrégats multi-devises |
| 4 | `DividendProjection.tsx` — synthèse + tableau yield on cost | PASS | Cartes adaptées au multi-devises, tableau trié par YoC |
| 5 | `src/lib/fmp-dividends.ts` — fetch FMP dividendes | PASS | Endpoint corrigé vers `/stable/dividends?symbol=...`, gestion explicite des erreurs config/service/rate limit |
| 6 | Historique passé cohérent avec les transactions | PASS | Quantité reconstituée à la date du dividende depuis les `buy/sell` |
| 7 | Navigation dashboard — lien "Dividendes" | PASS | Lien `href="/dashboard/dividendes"` présent |

---

## Correctifs post-review

- Correction de l’endpoint FMP dividendes : l’ancienne URL `/stable/dividends/{ticker}` était incorrecte et renvoyait `404 []` sur des titres valides comme `MSFT`.
- Suppression du diagnostic trompeur “clé invalide” sur ce cas.
- Gestion des `429` FMP non bloquante : un ticker limité est ignoré, la page reste exploitable pour les autres lignes.
- Affichage des montants dans la devise native au lieu de tout forcer en EUR.
- Correction de l’historique: les dividendes passés ne sont plus multipliés par la quantité courante, mais par la quantité détenue à la date du versement.

---

## Vérifications exécutées

### Vérifications réelles FMP

- `GET /stable/profile?symbol=MSFT&apikey=...` → `200`
- `GET /stable/dividends/MSFT?apikey=...` → `404 []`
- `GET /stable/dividends?symbol=MSFT&apikey=...` → `200` avec historique dividendes

### Vérifications projet

```bash
npm run test
npm run build
```

Résultat :
- `npm run test` → PASS
- `npm run build` → PASS
- 2 warnings CSS préexistants sur `var(--color-*)`, hors périmètre ticket

---

## Conclusion

Le ticket `#71` est maintenant **livrable**. Les régressions relevées pendant la review ont été corrigées sur `main`, et le comportement réel avec FMP a été revérifié avant validation finale.
