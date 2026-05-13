#!/usr/bin/env bash
set -euo pipefail

if [[ "$#" -eq 0 ]]; then
  echo "ERROR: command is required." >&2
  exit 1
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  exec "$@"
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-dtridldlztpqmcqkijvo}"
DB_HOST="${SUPABASE_DB_HOST:-db.${PROJECT_REF}.supabase.co}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"

if [[ -n "${SUPABASE_POOLER_HOST:-}" ]]; then
  DB_HOST="$SUPABASE_POOLER_HOST"
  DB_USER="${SUPABASE_DB_USER:-postgres.${PROJECT_REF}}"
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node is required to encode the database password." >&2
  exit 1
fi

echo "Preparing DATABASE_URL for command:"
echo "  host: ${DB_HOST}"
if [[ -n "${SUPABASE_DB_HOSTADDR:-}" ]]; then
  echo "  hostaddr: ${SUPABASE_DB_HOSTADDR} (psql-only; ignored by Node database clients)"
fi
echo "  port: ${DB_PORT}"
echo "  database: ${DB_NAME}"
echo "  user: ${DB_USER}"
echo "  command: $*"

read -r -s -p "Supabase database password: " DATABASE_PASSWORD
echo

ENCODED_PASSWORD="$(
  DATABASE_PASSWORD="$DATABASE_PASSWORD" node -e 'process.stdout.write(encodeURIComponent(process.env.DATABASE_PASSWORD ?? ""))'
)"

export DATABASE_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
unset DATABASE_PASSWORD
unset ENCODED_PASSWORD

exec "$@"
