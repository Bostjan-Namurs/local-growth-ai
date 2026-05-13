#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

printf "\n=== LocalGrowth AI local bootstrap ===\n\n"

if [[ ! -f "AGENTS.md" || ! -d "apps/api" ]]; then
  echo "ERROR: This does not look like the LocalGrowth AI repo root: $ROOT_DIR" >&2
  exit 1
fi

printf "Step 1: environment file\n"
if [[ ! -f .env ]]; then
  cp .env.example .env
  printf "✅ Created .env from .env.example\n"
else
  printf "✅ .env already exists; not overwriting\n"
fi

printf "\nStep 2: clean generated caches\n"
find . -type d \( -name '.vitest' -o -name '.next' -o -name 'dist' \) -prune -exec rm -rf {} + 2>/dev/null || true
printf "✅ Removed generated Node/test caches if present\n"

printf "\nStep 3: optional local Docker services\n"
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    docker compose -f docker-compose.dev.yml up -d
    printf "✅ Local Docker services started\n"
  else
    printf "⚠️  Docker is installed but not running. Skipping local services.\n"
  fi
else
  printf "⚠️  Docker/compose unavailable. Skipping local services.\n"
fi

printf "\nStep 4: Node package manager\n"
if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is required. Install with: brew install node" >&2
  exit 1
fi
printf "Using Node: %s\n" "$(node --version)"

if ! command -v pnpm >/dev/null 2>&1; then
  if command -v corepack >/dev/null 2>&1; then
    corepack enable
    corepack prepare pnpm@latest --activate
  else
    echo "ERROR: pnpm is required. Install with: npm install -g pnpm" >&2
    exit 1
  fi
fi
printf "Using pnpm: %s\n" "$(pnpm --version)"

printf "\nStep 5: install workspace dependencies\n"
pnpm install

printf "\nStep 6: run tests\n"
make test

cat <<'MSG'

=== Local bootstrap complete ===

Next:
  ./scripts/macos/03_init_git_snapshot.sh
  ./scripts/macos/04_install_codex_cli.sh
  ./start_codex_macos.sh
MSG
