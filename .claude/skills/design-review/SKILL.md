# Skill: design-review

> Audit visuel d'un composant ou d'une page, puis implémentation des corrections.
> Références : Trade Republic (minimalisme, whitespace) + Moning (UX investisseur français).

## Quand l'utiliser

Déclencher sur : "c'est pas beau", "améliore le design", "refais le style", "c'est pas top UX",
"fais-le comme Trade Republic", "audite ce composant", "polish visuel".

## Workflow obligatoire

1. **Lire** le(s) composant(s) cible(s) avec Read/Glob
2. **Lire** `src/app/globals.css` pour les variables CSS disponibles
3. **Auditer** selon les 5 axes ci-dessous
4. **Lister** les problèmes trouvés avec leur ligne
5. **Proposer** les corrections ciblées (jamais de réécriture complète)
6. **Implémenter** après accord du PO
7. **Vérifier** avec `npx tsc --noEmit`

---

## Les 5 axes d'audit

### 1. Hiérarchie visuelle
- Les chiffres importants (valeur portfolio, P&L) sont-ils en grand et gras ?
- Les labels sont-ils discrets (`text-xs text-[var(--color-text-sub)]`) ?
- Test du "squint" : fermer les yeux à moitié — voit-on l'info principale en premier ?
- Règle Trade Republic : **1 chiffre dominant par carte**, le reste en secondaire

### 2. Espacement — grille 8px
- Tous les espacements doivent être multiples de 4 ou 8px (Tailwind : `p-4`, `gap-6`, `p-5`)
- Whitespace généreux entre les sections (`space-y-6` minimum entre blocs)
- Padding des cartes : `p-5` ou `p-6` (jamais `p-2` sauf éléments très compacts)
- Règle Trade Republic : le vide est du design, pas un manque

### 3. Typographie
- Taille minimale : `text-xs` (12px) pour les labels, `text-sm` pour le contenu
- Chiffres financiers : `tabular-nums` pour l'alignement vertical
- Longueur de ligne : pas plus de 75 caractères par ligne de texte
- Truncate avec `truncate` ou `max-w-*` pour les noms longs (tickers, noms d'actifs)

### 4. Couleurs — cohérence thème
Variables disponibles dans globals.css :
```
--color-bg-primary    → fond de page
--color-bg-surface    → cartes et surfaces élevées
--color-border        → bordures
--color-text          → texte principal
--color-text-sub      → labels et texte secondaire
--color-accent        → bleu principal (actions, liens)
```
- Gains : `text-green-600` / Pertes : `text-red-500`
- Jamais de couleur hardcodée hors palette de données (graphiques)
- Pas de box-shadow excessive — les cartes utilisent `border`, pas `shadow`

### 5. Interactions et états
- Boutons : `hover:` systématique, `disabled:opacity-40 disabled:cursor-not-allowed`
- Transitions : `transition-colors` sur les éléments interactifs
- Loading : `opacity-40` ou spinner pour signaler l'attente
- Touch targets : minimum 44×44px pour les éléments cliquables sur mobile

---

## Patterns de référence (Trade Republic + Moning)

### Carte standard
```tsx
<section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
  <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Titre</h2>
  {/* contenu */}
</section>
```

### Valeur principale + label
```tsx
<div>
  <p className="text-xs text-[var(--color-text-sub)]">Valeur investie</p>
  <p className="text-2xl font-bold text-[var(--color-text)] tabular-nums">12 450,00 €</p>
</div>
```

### Badge gain/perte
```tsx
<span className={`text-sm font-medium tabular-nums ${value >= 0 ? 'text-green-600' : 'text-red-500'}`}>
  {value >= 0 ? '+' : ''}{value.toFixed(2)} %
</span>
```

### Onglets (Tab switcher)
```tsx
<div className="flex gap-1 text-xs bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg p-0.5">
  <button className="px-3 py-1 rounded-md bg-[var(--color-accent)] text-white font-medium">Actif</button>
  <button className="px-3 py-1 rounded-md text-[var(--color-text-sub)] hover:text-[var(--color-text)]">Inactif</button>
</div>
```

### Reproduire un design exemple
Si le PO fournit une image ou un screenshot :
1. Identifier les composants (carte, tableau, graphique, badge…)
2. Mapper vers les patterns de référence ci-dessus
3. Reproduire la hiérarchie visuelle exacte (taille de typo, spacing)
4. Utiliser les CSS variables du thème — jamais de couleurs hors palette

---

## Ce que ce skill ne fait PAS
- Ne modifie pas la logique métier ni les appels API
- Ne change pas les types TypeScript ou le schéma DB
- Ne réécrit pas un composant entier sans accord explicite
