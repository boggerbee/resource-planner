#!/bin/bash
# db-backup.sh — dump PostgreSQL til en backup-fil som kan restores i produksjon
#
# Bruk:
#   ./scripts/db-backup.sh                  # bruker DATABASE_URL fra .env
#   ./scripts/db-backup.sh .env.production  # bruker angitt env-fil
#
# Restore:
#   psql "$DATABASE_URL" < backups/resource_planner_20260323_120000.sql
#   -- eller --
#   ./scripts/db-restore.sh backups/resource_planner_20260323_120000.sql

set -euo pipefail

ENV_FILE="${1:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Feil: finner ikke $ENV_FILE" >&2
  exit 1
fi

# Last DATABASE_URL fra env-fil
DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"'"'")

if [[ -z "$DATABASE_URL" ]]; then
  echo "Feil: DATABASE_URL ikke funnet i $ENV_FILE" >&2
  exit 1
fi

# Strip Prisma-spesifikke query-parametere (f.eks. ?schema=public) som pg_dump ikke støtter
DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/?schema=[^&]*//;s/&schema=[^&]*//')

BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/resource_planner_${TIMESTAMP}.sql"

echo "Dumper database til $BACKUP_FILE ..."
pg_dump \
  --no-password \
  --format=plain \
  --no-owner \
  --no-privileges \
  --if-exists \
  --clean \
  "$DATABASE_URL" \
  > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "Ferdig: $BACKUP_FILE ($SIZE)"
