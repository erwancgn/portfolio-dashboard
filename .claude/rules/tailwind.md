# Tailwind v4 — Règles et conventions

## Principes

- Tailwind CSS pour le layout et l'espacement — pas de CSS custom pour ça
- CSS variables `var(--color-*)` uniquement pour les couleurs du thème
- Pas de `tailwind.config.ts` — toute la configuration est dans `globals.css`

## Style inline

`style={{}}` interdit sauf pour les valeurs CSS calculées dynamiquement inexprimables en Tailwind pur :
- `width: X%` pour une barre de progression
- `fill=` pour SVG/Recharts
- Toute valeur numérique calculée au runtime

Dans tous les autres cas, utiliser Tailwind.

## Restrictions visuelles

- Pas de `shadow-lg` / `shadow-xl`
- Pas de `border-2` ou plus
- Pas de `bg-[couleur vive]` sur les fonds (cohérence thème sombre/clair)

## Référence design

Style minimaliste inspiré Trade Republic + Moning. Voir `.claude/rules/` → agent `ux-agent` pour les détails UX/UI.
