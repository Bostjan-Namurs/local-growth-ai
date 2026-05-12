#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

ok() { printf "✅ %s\n" "$1"; }
warn() { printf "⚠️  %s\n" "$1"; }
fail() { printf "❌ %s\n" "$1"; }

printf "\n=== LocalGrowth AI macOS prerequisite check ===\n\n"

if [[ "$(uname -s)" == "Darwin" ]]; then
  ok "macOS detected: $(sw_vers -productVersion 2>/dev/null || echo Darwin)"
else
  warn "This bundle is macOS-focused, but current OS is: $(uname -s)"
fi

if xcode-select -p >/dev/null 2>&1; then
  ok "Xcode Command Line Tools: $(xcode-select -p)"
else
  warn "Xcode Command Line Tools not found. Install with: xcode-select --install"
fi

if command -v brew >/dev/null 2>&1; then
  ok "Homebrew: $(brew --version | head -n 1)"
else
  warn "Homebrew not found. Install it manually from https://brew.sh, or install tools another way."
fi

if command -v git >/dev/null 2>&1; then
  ok "git: $(git --version)"
else
  fail "git is missing. Install with: brew install git"
fi

PYTHON_BIN=""
for candidate in python3.12 python3; do
  if command -v "$candidate" >/dev/null 2>&1; then
    if "$candidate" - <<'PYCHECK' >/dev/null 2>&1
import sys
raise SystemExit(0 if sys.version_info >= (3, 12) else 1)
PYCHECK
    then
      PYTHON_BIN="$candidate"
      break
    fi
  fi
done

if [[ -n "$PYTHON_BIN" ]]; then
  ok "python: $($PYTHON_BIN --version) at $(command -v "$PYTHON_BIN")"
else
  fail "Python 3.12+ is missing. Install with: brew install python@3.12"
fi

if command -v node >/dev/null 2>&1; then
  ok "node: $(node --version)"
else
  warn "node is missing. Install with: brew install node"
fi

if command -v npm >/dev/null 2>&1; then
  ok "npm: $(npm --version)"
else
  warn "npm is missing. It is needed for Codex CLI. Install Node.js first."
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm: $(pnpm --version)"
else
  warn "pnpm is missing. Future frontend tasks may need it. You can enable it with: corepack enable && corepack prepare pnpm@latest --activate"
fi

if command -v docker >/dev/null 2>&1; then
  ok "docker: $(docker --version)"
  if docker compose version >/dev/null 2>&1; then
    ok "docker compose: $(docker compose version | head -n 1)"
  else
    warn "docker compose plugin not found."
  fi
  if docker info >/dev/null 2>&1; then
    ok "Docker daemon is running"
  else
    warn "Docker is installed but not running. Start Docker Desktop if you want local Postgres/Redis."
  fi
else
  warn "Docker is missing. It is optional for the first tests, but useful for local Postgres/Redis."
fi

if command -v codex >/dev/null 2>&1; then
  ok "codex: $(codex --version 2>/dev/null || echo installed)"
else
  warn "Codex CLI is missing. Install later with: ./scripts/macos/04_install_codex_cli.sh"
fi

printf "\nPrerequisite check complete.\n"
