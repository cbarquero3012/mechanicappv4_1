#!/bin/sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "[backup] Starting backups at $(date)..."

DATABASES=$(psql -t -A -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1') AND datistemplate = false ORDER BY datname;")

for DB in $DATABASES; do
  if echo "$DB" | grep -qE '^[a-zA-Z0-9_]+$'; then
    FILENAME="/backups/${DB}_${TIMESTAMP}.sql"
    echo "[backup] Dumping $DB..."
    pg_dump --format=plain --inserts --rows-per-insert=1000 --clean --if-exists --no-owner --no-privileges -d "$DB" -f "$FILENAME"
    if [ $? -eq 0 ]; then
      sed -i '/^\\restrict /d; /^\\unrestrict /d' "$FILENAME"
      echo "[backup] Success: $FILENAME"
    else
      echo "[backup] FAILED: $DB"
    fi
  else
    echo "[backup] SKIPPED (unsafe name): $DB"
  fi
done

echo "[backup] Backing up template database..."
pg_dump --format=plain --inserts --rows-per-insert=1000 --clean --if-exists --no-owner --no-privileges -d "mechanic_template" -f "/backups/mechanic_template_${TIMESTAMP}.sql" 2>/dev/null
if [ $? -eq 0 ]; then
  sed -i '/^\\restrict /d; /^\\unrestrict /d' "/backups/mechanic_template_${TIMESTAMP}.sql"
  echo "[backup] Template success"
else
  echo "[backup] Template backup skipped (may not exist)"
fi

echo "[backup] Rotating old backups (keeping last 7 per database)..."
for DB in $DATABASES mechanic_template; do
  ls -1t /backups/${DB}_*.sql 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
done

echo "[backup] All backups completed at $(date)"
ls -lh /backups/
