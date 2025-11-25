#!/bin/bash
set -e

# Remove any existing pid file
rm -f tmp/pids/server.pid
rm -f tmp/pids/*.pid

# Espera o Postgres ficar pronto
echo "⏳ Aguardando o Postgres em $POSTGRES_DB..."
# Debugging environment variables
echo "POSTGRES_USER: '${POSTGRES_USER}'"
echo "POSTGRES_PASSWORD: '${POSTGRES_PASSWORD}'"
echo "POSTGRES_DB: '${POSTGRES_DB}'"
echo "POSTGRES_HOST: '${POSTGRES_HOST}'"

# Exporta PGPASSWORD com aspas duplas para garantir que caracteres especiais sejam tratados literalmente
export PGPASSWORD="$(echo ${POSTGRES_PASSWORD} | tr -d '\n\r')"

# Limpa as variáveis de ambiente para remover quaisquer caracteres de nova linha
POSTGRES_USER=$(echo ${POSTGRES_USER} | tr -d '\n\r')
POSTGRES_PASSWORD=$(echo ${POSTGRES_PASSWORD} | tr -d '\n\r')
POSTGRES_DB=$(echo ${POSTGRES_DB} | tr -d '\n\r')
POSTGRES_HOST=$(echo ${POSTGRES_HOST} | tr -d '\n\r')
until psql -h "db" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres não disponível ainda - tentando novamente..."
  sleep 2
done
echo "✅ Postgres disponível!"

# Cria ou migra o banco de dados
echo "🔄 Rodando migrations..."
# Explicitly export DATABASE_URL to ensure it's available for Rails commands
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRES_DB}"
echo "Backend container sees DATABASE_URL: $DATABASE_URL"

# Add this for debugging:
echo "Rails environment: $RAILS_ENV"
echo "Checking Rails database configuration:"
bundle exec rails runner "puts ActiveRecord::Base.connection_db_config.configuration_hash.inspect"

# Create the database if it doesn't exist
echo "Creating database if it doesn't exist..."
bundle exec rails db:create || true

# Run migrations
echo "Running database migrations..."
bundle exec rails db:migrate

# Then exec the container's main process (what's set as CMD in the Dockerfile).
echo "Starting Rails server..."
exec "$@"
