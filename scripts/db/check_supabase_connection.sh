#!/usr/bin/env bash
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-dtridldlztpqmcqkijvo}"
DB_HOST="${SUPABASE_DB_HOST:-db.${PROJECT_REF}.supabase.co}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"

if [[ -n "${SUPABASE_POOLER_HOST:-}" ]]; then
  DB_HOST="$SUPABASE_POOLER_HOST"
  DB_USER="${SUPABASE_DB_USER:-postgres.${PROJECT_REF}}"
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required for Supabase connection checks." >&2
  exit 1
fi

echo "Checking Supabase database connectivity:"
echo "  host: ${DB_HOST}"
if [[ -n "${SUPABASE_DB_HOSTADDR:-}" ]]; then
  echo "  hostaddr: ${SUPABASE_DB_HOSTADDR}"
fi
echo "  port: ${DB_PORT}"
echo "  database: ${DB_NAME}"
echo "  user: ${DB_USER}"

read -r -s -p "Supabase database password: " PGPASSWORD
echo
export PGPASSWORD

CONNECTION="host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} sslmode=require connect_timeout=10"
if [[ -n "${SUPABASE_DB_HOSTADDR:-}" ]]; then
  CONNECTION="host=${DB_HOST} hostaddr=${SUPABASE_DB_HOSTADDR} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} sslmode=require connect_timeout=10"
fi

psql \
  "$CONNECTION" \
  -v ON_ERROR_STOP=1 \
  -c "select current_database() as database, current_user as user_name, inet_server_addr()::text as server_addr;"
