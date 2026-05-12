#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

cat <<'MSG'
This runs Codex in non-interactive exec mode for Task 2.
For the first few sessions, interactive mode is safer:
  ./start_codex_macos.sh
MSG

printf "Run non-interactive Codex exec anyway? [y/N] "
read -r answer
case "$answer" in
  y|Y|yes|YES) ;;
  *) echo "Cancelled."; exit 0 ;;
esac

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: Codex CLI is not installed." >&2
  exit 1
fi

exec codex exec --sandbox workspace-write --ask-for-approval on-request "$(cat for-codex/CODEX_START_TASK_02_PROMPT.md)"
