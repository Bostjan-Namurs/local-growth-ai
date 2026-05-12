#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

printf "\n=== LocalGrowth AI macOS setup ===\n\n"
./scripts/macos/00_check_prereqs.sh
./scripts/macos/02_bootstrap_local.sh
./scripts/macos/03_init_git_snapshot.sh

cat <<'MSG'

=== Setup finished ===

Next:
  ./scripts/macos/04_install_codex_cli.sh
  ./start_codex_macos.sh

MSG
