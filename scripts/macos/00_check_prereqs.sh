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

if command -v node >/dev/null 2>&1; then
  ok "node: $(node --version)"
else
  fail "node is missing. Install with: brew install node"
fi

if command -v npm >/dev/null 2>&1; then
  ok "npm: $(npm --version)"
else
  warn "npm is missing. It is needed for Codex CLI. Install Node.js first."
fi

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm: $(pnpm --version)"
else
  fail "pnpm is missing. Enable it with: corepack enable && corepack prepare pnpm@latest --activate"
fi

if command -v psql >/dev/null 2>&1; then
  ok "psql: $(psql --version)"
else
  warn "psql is missing. It is required for Supabase DB checks and migrations. Install with: brew install libpq"
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
