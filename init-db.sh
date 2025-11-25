#!/bin/bash
set -e

# Script to initialize PostgreSQL database with correct user and permissions

echo "🔧 Initializing PostgreSQL database..."

# Wait for PostgreSQL to be ready
until pg_isready -h db -U "$POSTGRES_USER"; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    SELECT 'CREATE DATABASE $POSTGRES_DB'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB')\gexec
EOSQL

echo "✅ Database '$POSTGRES_DB' ensured to exist"

# Grant all privileges
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
EOSQL

echo "✅ Privileges granted to user '$POSTGRES_USER'"
echo "🎉 Database initialization completed!"
