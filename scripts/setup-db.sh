#!/usr/bin/env bash
# Local dev/test PostgreSQL setup (Homebrew postgresql@16 — no Docker on this machine).
# Idempotent: safe to re-run.
set -euo pipefail

PG_BIN="/opt/homebrew/opt/postgresql@16/bin"
export PATH="$PG_BIN:$PATH"

ROLE="payflow"
ROLE_PASSWORD="payflow"
DEV_DB="payflow_dev"
TEST_DB="payflow_test"

echo "==> Ensuring postgresql@16 service is running"
brew services start postgresql@16 >/dev/null 2>&1 || true
for _ in $(seq 1 10); do
  pg_isready -q && break
  sleep 1
done
pg_isready

SUPERUSER="$(whoami)"

echo "==> Ensuring role '$ROLE' exists"
psql -U "$SUPERUSER" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$ROLE'" | grep -q 1 \
  || psql -U "$SUPERUSER" -d postgres -c "CREATE ROLE $ROLE LOGIN PASSWORD '$ROLE_PASSWORD';"

# CREATEDB is required so Prisma's `migrate dev` can create/drop its ephemeral shadow database.
echo "==> Ensuring role '$ROLE' has CREATEDB (needed by Prisma's shadow database)"
psql -U "$SUPERUSER" -d postgres -c "ALTER ROLE $ROLE CREATEDB;"

for DB in "$DEV_DB" "$TEST_DB"; do
  echo "==> Ensuring database '$DB' exists (owner: $ROLE)"
  psql -U "$SUPERUSER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB'" | grep -q 1 \
    || psql -U "$SUPERUSER" -d postgres -c "CREATE DATABASE $DB OWNER $ROLE;"
done

echo "==> Done. Dev DB:  postgresql://$ROLE:$ROLE_PASSWORD@localhost:5432/$DEV_DB"
echo "==> Done. Test DB: postgresql://$ROLE:$ROLE_PASSWORD@localhost:5432/$TEST_DB"
