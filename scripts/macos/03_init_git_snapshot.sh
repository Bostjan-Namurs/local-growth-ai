#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf "\n=== Git snapshot setup ===\n\n"

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git is not installed. Install with: brew install git" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git init
  printf "✅ Initialized Git repository\n"
else
  printf "✅ Git repository already exists\n"
fi

find . -type d \( -name '.vitest' -o -name '.next' -o -name 'dist' \) -prune -exec rm -rf {} + 2>/dev/null || true

git add .

if git diff --cached --quiet; then
  printf "✅ No staged changes to commit\n"
  exit 0
fi

if ! git config user.name >/dev/null || ! git config user.email >/dev/null; then
  cat <<'MSG'
⚠️  Git user.name or user.email is not configured.
Files are staged, but no commit was created.

Configure Git once, then commit manually:
  git config --global user.name "Your Name"
  git config --global user.email "you@example.com"
  git commit -m "Initial LocalGrowth AI scaffold"
MSG
  exit 0
fi

git commit -m "Initial LocalGrowth AI scaffold"
printf "✅ Created initial Git snapshot\n"
