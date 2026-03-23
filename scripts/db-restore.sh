#!/bin/bash
# db-restore.sh — restore en backup-fil til PostgreSQL
#
# Bruk:
#   ./scripts/db-restore.sh backups/resource_planner_20260323_120000.sql.gz
#   ./scripts/db-restore.sh backups/resource_planner_20260323_120000.sql.gz .env.production

set -euo pipefail

BACKUP_FILE="${1:-}"
ENV_FILE="${2:-.env}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Bruk: $0 <backup-fil> [env-fil]" >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Feil: finner ikke $BACKUP_FILE" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Feil: finner ikke $ENV_FILE" >&2
  exit 1
fi

DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'")

if [[ -z "$DATABASE_URL" ]]; then
  echo "Feil: DATABASE_URL ikke funnet i $ENV_FILE" >&2
  exit 1
fi

echo "ADVARSEL: Dette vil overskrive databasen pekt på av $ENV_FILE"
echo "Backup-fil: $BACKUP_FILE"
read -r -p "Er du sikker? [y/N] " CONFIRM
if [[ "${CONFIRM,,}" != "y" ]]; then
  echo "Avbrutt."
  exit 0
fi

echo "Restorer $BACKUP_FILE ..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | psql --no-password "$DATABASE_URL"
else
  psql --no-password "$DATABASE_URL" < "$BACKUP_FILE"
fi

echo "Ferdig."
