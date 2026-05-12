#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This installer is for macOS only."
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  cat <<'MSG'
Homebrew is not installed.
Install Homebrew first from https://brew.sh, then rerun this script.

Homebrew install command from the official site is usually:
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
MSG
  exit 1
fi

cat <<'MSG'
This script can install/update common development prerequisites through Homebrew:
  git
  python@3.12
  node

It will not install Docker Desktop automatically.
It will not install Codex CLI; use scripts/macos/04_install_codex_cli.sh for that.
MSG

printf "\nContinue with Homebrew installs? [y/N] "
read -r answer
case "$answer" in
  y|Y|yes|YES) ;;
  *) echo "Cancelled."; exit 0 ;;
esac

brew update
brew install git python@3.12 node

if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@latest --activate || true
fi

cat <<'MSG'

Homebrew prerequisites installed.
Docker Desktop is optional for the first tests. Install it separately if needed.
Next:
  ./scripts/macos/00_check_prereqs.sh
  ./setup_macos.sh
MSG
