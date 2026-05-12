#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Not a Git repository." >&2
  exit 1
fi

cat <<'MSG'
This will remove ALL uncommitted changes and untracked files in this repository.
It runs:
  git restore .
  git clean -fd

This cannot be undone unless you have backups.
MSG

printf "Type DELETE to continue: "
read -r answer
if [[ "$answer" != "DELETE" ]]; then
  echo "Cancelled."
  exit 0
fi

git restore .
git clean -fd

echo "✅ Uncommitted changes removed."
