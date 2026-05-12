#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: Codex CLI is not installed. Run ./scripts/macos/04_install_codex_cli.sh first." >&2
  exit 1
fi

cat <<'MSG'

=== Opening Codex interactive mode ===

Useful first prompt:
  Read AGENTS.md and for-codex/IMPLEMENTATION_BRIEF.md. Inspect the repo and summarize current implementation state. Do not edit files yet.

MSG

exec codex --sandbox workspace-write --ask-for-approval on-request
