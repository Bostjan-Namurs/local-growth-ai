#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

if ! command -v codex >/dev/null 2>&1; then
  echo "ERROR: Codex CLI is not installed. Run ./scripts/macos/04_install_codex_cli.sh first." >&2
  exit 1
fi

PROMPT_FILE="for-codex/CODEX_START_TASK_03_PROMPT.md"
if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "ERROR: Missing $PROMPT_FILE" >&2
  exit 1
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [[ -n "$(git status --short)" ]]; then
  echo "⚠️  Git working tree has uncommitted changes. Commit or discard Task 2 changes before Task 3."
  git status --short
  printf "Continue anyway? [y/N] "
  read -r answer
  case "$answer" in
    y|Y|yes|YES) ;;
    *) echo "Cancelled."; exit 0 ;;
  esac
fi

cat <<MSG

=== Starting Codex: Sprint 1 Task 3 ===
Working directory: $ROOT_DIR
Prompt file: $PROMPT_FILE
Permissions: --sandbox workspace-write --ask-for-approval on-request

MSG

exec codex --sandbox workspace-write --ask-for-approval on-request "$(cat "$PROMPT_FILE")"
