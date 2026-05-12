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
find . -type d \( -name '__pycache__' -o -name '.pytest_cache' -o -name '.mypy_cache' -o -name '.ruff_cache' \) -prune -exec rm -rf {} + 2>/dev/null || true
printf "✅ Removed generated Python/test caches if present\n"

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

printf "\nStep 4: Python virtual environment\n"
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

if [[ -z "$PYTHON_BIN" ]]; then
  echo "ERROR: Python 3.12+ is required. Install with: brew install python@3.12" >&2
  exit 1
fi
printf "Using Python: %s\n" "$($PYTHON_BIN --version)"

if [[ ! -d .venv ]]; then
  "$PYTHON_BIN" -m venv .venv
  printf "✅ Created .venv\n"
else
  printf "✅ .venv already exists\n"
fi

# shellcheck source=/dev/null
source .venv/bin/activate
python -m pip install --upgrade pip wheel

printf "\nStep 5: install API development dependencies\n"
(cd apps/api && python -m pip install -e '.[dev]')

printf "\nStep 6: run backend tests\n"
(cd apps/api && python -m pytest tests)

cat <<'MSG'

=== Local bootstrap complete ===

Next:
  ./scripts/macos/03_init_git_snapshot.sh
  ./scripts/macos/04_install_codex_cli.sh
  ./start_codex_macos.sh
MSG
