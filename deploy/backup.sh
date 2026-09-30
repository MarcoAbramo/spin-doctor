#!/bin/sh
# Database backups for docker-compose.prod.yml: a gzipped pg_dump into /backups every
# BACKUP_INTERVAL_SEC (default: daily), files older than BACKUP_KEEP_DAYS are deleted.
# Restore: see docs/DEPLOY.md.
set -eu
: "${BACKUP_INTERVAL_SEC:=86400}"
: "${BACKUP_KEEP_DAYS:=14}"

until pg_isready -q; do sleep 2; done
while true; do
  file="/backups/spin-$(date -u +%Y-%m-%dT%H%M%SZ).sql.gz"
  if pg_dump --no-owner --clean --if-exists | gzip > "$file.part"; then
    mv "$file.part" "$file"
    echo "backup written: $file"
  else
    rm -f "$file.part"
    echo "backup FAILED" >&2
  fi
  find /backups -name 'spin-*.sql.gz' -mtime +"$BACKUP_KEEP_DAYS" -delete
  sleep "$BACKUP_INTERVAL_SEC"
done
