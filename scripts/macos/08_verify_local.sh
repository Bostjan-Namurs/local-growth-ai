#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf "\n=== Local verification ===\n\n"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm not found. Run ./scripts/macos/02_bootstrap_local.sh first." >&2
  exit 1
fi

make help >/dev/null
make lint
make typecheck
make test

printf "\nGit status:\n"
git status --short || true

printf "\nVerification complete.\n"
