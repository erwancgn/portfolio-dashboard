# Skill: finance-formulas

> Formules et métriques financières pour un investisseur particulier français.
> Adapté au contexte du Portfolio Dashboard : PEA, CTO, Crypto, flat tax 30%.

## Quand l'utiliser

Déclencher sur : tout calcul financier dans le code (P&L, rendement, CAGR, Sharpe,
allocation, fiscalité, diversification), ou pour conseiller le PO sur une métrique.

---

## 1. Calculs de base — positions

```
Valeur position    = quantité × prix_actuel
Valeur investie    = quantité × pru
P&L (€)            = valeur_position - valeur_investie
P&L (%)            = (P&L / valeur_investie) × 100
Poids (%)          = (valeur_position / valeur_totale_portfolio) × 100
```

**PRU — calcul DCA :**
```
nouveau_pru = (ancienne_quantité × ancien_pru + montant_investi)
              ÷ (ancienne_quantité + quantité_achetée)
```

---

## 2. Rendement et performance

**Rendement simple (HPR) :**
```
HPR = (valeur_finale - valeur_initiale) / valeur_initiale × 100
```

**CAGR (rendement annualisé) :**
```
CAGR = (valeur_finale / valeur_initiale)^(1/n) - 1
```
`n` = années de détention. Ex : 10 000€ → 14 500€ en 3 ans → CAGR = 13.2%/an

```typescript
const years = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 3600 * 1000)
const cagr = (Math.pow(currentValue / investedValue, 1 / years) - 1) * 100
```

---

## 3. Métriques de risque

**Volatilité annualisée :**
```
σ_annuelle = écart_type(rendements_journaliers) × √252
```
252 = nombre de jours de bourse par an.

**Sharpe Ratio :**
```
Sharpe = (rendement_portfolio - taux_sans_risque) / volatilité
```
- Taux sans risque FR 2026 : ~3% (OAT 10 ans)
- Sharpe > 1 = bon / > 2 = excellent / < 0 = sous-performer le cash

**Drawdown (chute depuis le sommet) :**
```
Drawdown = (valeur_actuelle - valeur_max_historique) / valeur_max_historique × 100
```

---

## 4. Allocation et diversification

**Concentration HHI (Herfindahl-Hirschman Index) :**
```
HHI = Σ(poids_i²)    // poids en décimal : 30% → 0.30
```
- HHI < 0.15 → diversifié
- HHI 0.15–0.25 → modérément concentré
- HHI > 0.25 → concentration excessive — alerter le PO

**Besoin de rééquilibrage :**
```
écart = poids_réel - poids_cible
montant_à_acheter = (poids_cible × valeur_totale - valeur_position) / prix_actuel
```

---

## 5. Fiscalité française

| Enveloppe | Régime | Taux plus-value |
|-----------|--------|-----------------|
| PEA | Exonéré (après 5 ans) | 0% |
| CTO | Flat tax PFU | 30% (12.8% IR + 17.2% PS) |
| Crypto | Flat tax PFU | 30% |

**Calcul taxe à la vente :**
```
plus_value    = (prix_vente - pru) × quantité_vendue
taxe          = max(0, plus_value) × 0.30    // jamais de taxe sur une moins-value
net_reçu      = (prix_vente × quantité_vendue) - taxe
```

---

## 6. Implémentation TypeScript — fonctions de référence

```typescript
/** P&L en euros d'une position */
function calcPnl(quantity: number, pru: number, currentPrice: number): number {
  return quantity * (currentPrice - pru)
}

/** Poids d'une position dans le portfolio (%) */
function calcWeight(positionValue: number, totalValue: number): number {
  if (totalValue === 0) return 0
  return (positionValue / totalValue) * 100
}

/** CAGR depuis date d'achat (%) */
function calcCagr(investedValue: number, currentValue: number, purchaseDate: Date): number {
  const years = (Date.now() - purchaseDate.getTime()) / (365.25 * 24 * 3600 * 1000)
  if (years < 0.01 || investedValue <= 0) return 0
  return (Math.pow(currentValue / investedValue, 1 / years) - 1) * 100
}

/** Taxe flat tax 30% à la vente — CTO et Crypto uniquement */
function calcTax(pru: number, sellPrice: number, quantity: number, envelope: string): number {
  if (envelope === 'PEA') return 0
  const gain = (sellPrice - pru) * quantity
  return Math.max(0, gain) * 0.30
}

/** HHI de concentration du portfolio */
function calcHHI(positions: Array<{ value: number }>, totalValue: number): number {
  return positions.reduce((hhi, pos) => {
    const weight = pos.value / totalValue
    return hhi + weight * weight
  }, 0)
}
```

---

## 7. Seuils d'alerte — investisseur particulier français

| Métrique | Seuil | Signification |
|----------|-------|---------------|
| P&L position | < −20% | Vérifier la thèse d'investissement |
| Poids position | > 25% | Concentration excessive |
| HHI | > 0.25 | Portfolio sur-concentré |
| CAGR sur 3 ans | < 3% | Sous-performer le taux sans risque FR |
| Sharpe | < 0 | Rendement insuffisant vs risque pris |
