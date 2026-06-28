#!/bin/bash
set -e
set -o pipefail

# Remove o arquivo server.pid para evitar falhas de inicialização do Rails
rm -f tmp/pids/server.pid

# === CONFIGURAÇÃO E ESPERA PELO BANCO DE DADOS ===

# Limpa e exporta variáveis de ambiente para o 'psql'
export PGPASSWORD=$(echo "${POSTGRES_PASSWORD}" | tr -d '\n\r')

POSTGRES_HOST=$(echo "${POSTGRES_HOST}" | tr -d '\n\r')
POSTGRES_USER=$(echo "${POSTGRES_USER}" | tr -d '\n\r')
POSTGRES_DB=$(echo "${POSTGRES_DB}" | tr -d '\n\r')
POSTGRES_DEFAULT_DB=${POSTGRES_DEFAULT_DB:-postgres}

echo "⏳ Aguardando o Postgres em $POSTGRES_HOST (User: $POSTGRES_USER)..."

max_retries=30
count=0
until psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DEFAULT_DB" -c '\q' > /dev/null 2>&1; do
  count=$((count + 1))
  if [ $count -gt $max_retries ]; then
    echo "❌ Erro: Postgres não ficou disponível após $max_retries tentativas."
    exit 1
  fi
  echo "Postgres não disponível ainda ($count/$max_retries) - tentando novamente..."
  sleep 2
done

echo "✅ Postgres disponível!"

# Migrations are intentionally not run here. The deploy workflow executes them
# once, before replacing the running application containers. Keeping database
# work out of the shared entrypoint also prevents Sidekiq restarts from booting
# extra Rails processes on the production host.
echo "Starting application process..."
exec "$@"
