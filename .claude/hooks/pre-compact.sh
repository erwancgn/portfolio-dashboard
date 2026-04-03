#!/bin/bash
# Hook: pre-compact — sauvegarde l'état avant compaction
# Déclenché par: PreCompact dans settings.json

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CACHE_FILE="$PROJECT_ROOT/.claude/cache.md"

echo "=== Pre-Compact: sauvegarde état ==="

# Sauvegarder le résumé dans cache.md
{
  echo "# Cache — État avant dernière compaction"
  echo ""
  echo "Date: $(date '+%Y-%m-%d %H:%M')"
  echo "Branch: $(git branch --show-current)"
  echo ""
  echo "## Derniers commits"
  git log --oneline -10
  echo ""
  echo "## Fichiers modifiés"
  git status --porcelain 2>/dev/null
  echo ""
} > "$CACHE_FILE"

echo "État sauvegardé dans $CACHE_FILE"
