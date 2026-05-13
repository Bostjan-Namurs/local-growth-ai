#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-${ROOT_DIR}/migrations/drizzle}"
PROJECT_REF="${SUPABASE_PROJECT_REF:-dtridldlztpqmcqkijvo}"
DB_HOST="${SUPABASE_DB_HOST:-db.${PROJECT_REF}.supabase.co}"
DB_PORT="${SUPABASE_DB_PORT:-5432}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
BASELINE_EXISTING="${MIGRATIONS_BASELINE_EXISTING:-false}"

if [[ -n "${SUPABASE_POOLER_HOST:-}" ]]; then
  DB_HOST="$SUPABASE_POOLER_HOST"
  DB_USER="${SUPABASE_DB_USER:-postgres.${PROJECT_REF}}"
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required to apply migrations." >&2
  exit 1
fi

if ! command -v shasum >/dev/null 2>&1; then
  echo "ERROR: shasum is required to checksum migrations." >&2
  exit 1
fi

sql_literal() {
  local value="$1"
  printf "'%s'" "$(printf "%s" "$value" | sed "s/'/''/g")"
}

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "ERROR: migrations directory not found: ${MIGRATIONS_DIR}" >&2
  exit 1
fi

echo "Applying database migrations:"
echo "  host: ${DB_HOST}"
if [[ -n "${SUPABASE_DB_HOSTADDR:-}" ]]; then
  echo "  hostaddr: ${SUPABASE_DB_HOSTADDR}"
fi
echo "  port: ${DB_PORT}"
echo "  database: ${DB_NAME}"
echo "  user: ${DB_USER}"
echo "  migrations: ${MIGRATIONS_DIR}"
if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "  connection: DATABASE_URL"
fi

if [[ "$BASELINE_EXISTING" == "true" ]]; then
  echo "  mode: baseline existing schema without executing SQL"
else
  echo "  mode: apply unapplied migrations"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  CONNECTION="$DATABASE_URL"
else
  read -r -s -p "Supabase database password: " PGPASSWORD
  echo
  export PGPASSWORD

  CONNECTION="host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} sslmode=require connect_timeout=10"
  if [[ -n "${SUPABASE_DB_HOSTADDR:-}" ]]; then
    CONNECTION="host=${DB_HOST} hostaddr=${SUPABASE_DB_HOSTADDR} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} sslmode=require connect_timeout=10"
  fi
fi

psql "$CONNECTION" -v ON_ERROR_STOP=1 <<'SQL'
CREATE SCHEMA IF NOT EXISTS localgrowth_internal;

CREATE TABLE IF NOT EXISTS localgrowth_internal.schema_migrations (
  version text PRIMARY KEY,
  filename text NOT NULL,
  checksum text NOT NULL,
  applied_at timestamp with time zone DEFAULT now() NOT NULL
);
SQL

MIGRATION_FILES=()
while IFS= read -r migration_file; do
  MIGRATION_FILES+=("$migration_file")
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)

if [[ "${#MIGRATION_FILES[@]}" -eq 0 ]]; then
  echo "ERROR: no migration SQL files found in ${MIGRATIONS_DIR}" >&2
  exit 1
fi

for migration_file in "${MIGRATION_FILES[@]}"; do
  filename="$(basename "$migration_file")"
  version="${filename%.sql}"
  checksum="$(shasum -a 256 "$migration_file" | awk '{print $1}')"
  version_literal="$(sql_literal "$version")"
  filename_literal="$(sql_literal "$filename")"
  checksum_literal="$(sql_literal "$checksum")"
  applied_checksum="$(
    psql "$CONNECTION" \
      -v ON_ERROR_STOP=1 \
      -At \
      -c "SELECT checksum FROM localgrowth_internal.schema_migrations WHERE version = ${version_literal};"
  )"

  if [[ -n "$applied_checksum" ]]; then
    if [[ "$applied_checksum" != "$checksum" ]]; then
      echo "ERROR: migration checksum changed after apply: ${filename}" >&2
      echo "  recorded: ${applied_checksum}" >&2
      echo "  current:  ${checksum}" >&2
      exit 1
    fi

    echo "skip ${filename}"
    continue
  fi

  if [[ "$BASELINE_EXISTING" == "true" ]]; then
    psql "$CONNECTION" \
      -v ON_ERROR_STOP=1 \
      -c "INSERT INTO localgrowth_internal.schema_migrations (version, filename, checksum) VALUES (${version_literal}, ${filename_literal}, ${checksum_literal});" >/dev/null
    echo "baseline ${filename}"
    continue
  fi

  echo "apply ${filename}"
  psql "$CONNECTION" -v ON_ERROR_STOP=1 --single-transaction -f "$migration_file"
  psql "$CONNECTION" \
    -v ON_ERROR_STOP=1 \
    -c "INSERT INTO localgrowth_internal.schema_migrations (version, filename, checksum) VALUES (${version_literal}, ${filename_literal}, ${checksum_literal});" >/dev/null
done

psql "$CONNECTION" \
  -v ON_ERROR_STOP=1 \
  -c "SELECT version, checksum, applied_at FROM localgrowth_internal.schema_migrations ORDER BY version;"
