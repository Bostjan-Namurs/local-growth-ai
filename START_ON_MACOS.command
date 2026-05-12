#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"
clear || true
cat README_START_HERE_MACOS.md
printf "\nThis helper can run the safe setup sequence now.\n"
printf "Run ./setup_macos.sh? [y/N] "
read -r answer
case "$answer" in
  y|Y|yes|YES)
    ./setup_macos.sh
    ;;
  *)
    printf "\nSetup not run. Open Terminal and run:\n  cd %s\n  ./setup_macos.sh\n" "$ROOT_DIR"
    ;;
esac
printf "\nPress Enter to close."
read -r _ || true
