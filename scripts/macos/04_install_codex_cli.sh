#!/usr/bin/env bash
set -euo pipefail

printf "\n=== Install / upgrade OpenAI Codex CLI ===\n\n"

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm is required. Install Node.js first, for example: brew install node" >&2
  exit 1
fi

if command -v codex >/dev/null 2>&1; then
  echo "Codex is already installed: $(codex --version 2>/dev/null || echo installed)"
  printf "Upgrade to latest @openai/codex with npm? [y/N] "
else
  echo "Codex CLI is not installed."
  printf "Install @openai/codex globally with npm? [y/N] "
fi

read -r answer
case "$answer" in
  y|Y|yes|YES) ;;
  *) echo "Cancelled."; exit 0 ;;
esac

npm i -g @openai/codex@latest

if command -v codex >/dev/null 2>&1; then
  echo "✅ Codex installed: $(codex --version 2>/dev/null || echo installed)"
else
  echo "⚠️  codex command not found after install. Check npm global bin path."
fi

cat <<'MSG'

Next:
  ./start_codex_macos.sh

On first run, Codex will prompt you to sign in with your ChatGPT account or API key.
MSG
