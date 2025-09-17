#!/bin/bash
set -e

# Cursor cage manager
# Usage:
#   ./scripts/cursor-cage.sh on <profile>
#   ./scripts/cursor-cage.sh off
#   ./scripts/cursor-cage.sh list

CAGE_DIR="scripts/cages"

on_profile() {
  local profile="$1"
  local file="$CAGE_DIR/$profile.txt"

  if [ ! -f "$file" ]; then
    echo "❌ Profile '$profile' not found in $CAGE_DIR"
    exit 1
  fi

  echo "🔒 Activating cage profile: $profile"
  git sparse-checkout init --cone
  git sparse-checkout set $(cat "$file")
  echo "✅ Cage '$profile' activated."
}

off_cage() {
  echo "🔓 Disabling cage (full repo view)..."
  git sparse-checkout disable
  echo "✅ Cage disabled."
}

list_profiles() {
  echo "📂 Available cage profiles:"
  ls -1 "$CAGE_DIR"/*.txt 2>/dev/null | sed 's#.*/##;s/\.txt$//'
}

case "$1" in
  on)
    if [ -z "$2" ]; then
      echo "Usage: $0 on <profile>"
      exit 1
    fi
    on_profile "$2"
    ;;
  off)
    off_cage
    ;;
  list)
    list_profiles
    ;;
  *)
    echo "Usage: $0 [on <profile> | off | list]"
    exit 1
    ;;
esac
