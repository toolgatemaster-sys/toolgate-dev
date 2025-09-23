#!/usr/bin/env bash
set -euo pipefail
ALLOWED='^(apps/gateway/src|apps/gateway/__tests__|packages/core|md/day5|scripts)/'
CHANGED=$(git diff --name-only --cached || true)
if [ -z "$CHANGED" ]; then
  echo "[CAGE] No staged changes."
  exit 0
fi
BAD=$(echo "$CHANGED" | grep -vE "$ALLOWED" || true)
if [ -n "$BAD" ]; then
  echo "[CAGE] Files outside Day5 cage:"
  echo "$BAD"
  exit 1
fi
echo "[CAGE] OK"
