#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf "\n=== Local verification ===\n\n"

if [[ -d .venv ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
fi

if ! command -v python >/dev/null 2>&1; then
  echo "ERROR: python not found. Run ./scripts/macos/02_bootstrap_local.sh first." >&2
  exit 1
fi

(cd apps/api && python -m pytest tests)

printf "\nGit status:\n"
git status --short || true

printf "\nVerification complete.\n"
