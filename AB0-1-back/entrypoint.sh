#!/bin/bash
set -e

# Remove a potentially pre-existing server.pid for Rails
rm -f tmp/pids/server.pid

# Espera o Postgres ficar pronto
echo "⏳ Aguardando o Postgres..."
# Lógica de espera...
until psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres não disponível ainda - tentando novamente..."
  sleep 2
done
echo "✅ Postgres disponível!"

# Remova toda a lógica de IF/ELSE que chama db:create/db:migrate/db:seed

# Execute o comando principal do contêiner (ex: rails server)
echo "Starting Rails server..."
exec "$@"