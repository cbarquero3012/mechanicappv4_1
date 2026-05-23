#!/bin/bash
# Creates the mechanic_template database and marks it as a template.
# This runs as part of docker-entrypoint-initdb.d (after SQL scripts).

set -e

echo "[init_template_db] Creating mechanic_template database..."

# Create the template database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE mechanic_template OWNER $POSTGRES_USER;
EOSQL

# Apply the template schema
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "mechanic_template" -f /tmp/mechanic_template_schema.sql

# Mark as template so it can be cloned with CREATE DATABASE ... TEMPLATE
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    UPDATE pg_database SET datistemplate = true WHERE datname = 'mechanic_template';
EOSQL

echo "[init_template_db] mechanic_template created and marked as template."
