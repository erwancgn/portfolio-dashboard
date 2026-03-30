#!/bin/bash
# PostToolUse hook — lance ESLint automatiquement après chaque édition de fichier .ts/.tsx
# Ticket #62 — Setup Claude Code: Hooks

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE" == *.ts || "$FILE" == *.tsx ]]; then
  npx eslint "$FILE" --ext .ts,.tsx 2>&1
fi
exit 0
