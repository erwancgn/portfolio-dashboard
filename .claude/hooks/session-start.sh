#!/bin/bash
# Hook: session-start — charge le contexte automatiquement
# Déclenché par: SessionStart dans settings.json

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

echo "=== Portfolio Dashboard — Session Context ==="
echo ""

# Branch courante
echo "Branch: $(git branch --show-current)"
echo ""

# Derniers commits
echo "Derniers commits:"
git log --oneline -5
echo ""

# Fichiers modifiés non commités
CHANGES=$(git status --porcelain 2>/dev/null)
if [ -n "$CHANGES" ]; then
  echo "Fichiers modifiés non commités:"
  echo "$CHANGES"
  echo ""
fi

# SESSION.md — dernières lignes (contexte session)
if [ -f "$PROJECT_ROOT/SESSION.md" ]; then
  echo "SESSION.md (dernières 20 lignes):"
  tail -20 "$PROJECT_ROOT/SESSION.md"
  echo ""
fi

echo "=== Prêt ==="
