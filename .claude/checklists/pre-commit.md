# Checklist — Pre-Commit

Avant de proposer un commit au PO :

- [ ] `npm run build` — succès
- [ ] `npx tsc --noEmit` — succès
- [ ] `npm run lint` — succès
- [ ] Message commit au format conventionnel (feat:/fix:/docs:/chore:/test:)
- [ ] Seuls les fichiers du périmètre du ticket sont modifiés
- [ ] Pas de fichier `.env` ou secret dans le staging
- [ ] Le PO comprend ce qui a été fait et pourquoi
