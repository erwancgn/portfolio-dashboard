#!/bin/bash

# Réouvre tous les tickets fermés par erreur
# Usage : bash scripts/reopen-issues.sh erwancgn/portfolio-dashboard

REPO=$1

if [ -z "$REPO" ]; then
  echo "❌ Usage : bash scripts/reopen-issues.sh USERNAME/portfolio-dashboard"
  exit 1
fi

# Tickets à rouvrir (tous sauf #6,7,8,9,10 qui sont vraiment terminés)
ISSUES=(19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38)

echo "🔄 Réouverture de ${#ISSUES[@]} tickets..."

for issue in "${ISSUES[@]}"; do
  gh issue reopen $issue --repo $REPO
  echo "✅ #$issue rouvert"
done

echo ""
echo "✅ Tous les tickets ont été réouverts !"