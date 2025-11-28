#!/bin/bash
set -e

# Remove o arquivo server.pid para evitar falhas de inicialização do Rails
rm -f tmp/pids/server.pid

# === CONFIGURAÇÃO E ESPERA PELO BANCO DE DADOS ===

# Limpa e exporta variáveis de ambiente para o 'psql' (necessário por causa de caracteres especiais na senha)
export PGPASSWORD=$(echo ${POSTGRES_PASSWORD} | tr -d '\n\r')

POSTGRES_HOST=$(echo ${POSTGRES_HOST} | tr -d '\n\r')
POSTGRES_USER=$(echo ${POSTGRES_USER} | tr -d '\n\r')
POSTGRES_DB=$(echo ${POSTGRES_DB} | tr -d '\n\r')

echo "⏳ Aguardando o Postgres em $POSTGRES_HOST..."

until psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q'; do
  echo "Postgres não disponível ainda - tentando novamente..."
  sleep 2
done

echo "✅ Postgres disponível!"

# === INÍCIO DA APLICAÇÃO ===

# O comando de migração/seed será executado separadamente pelo docker-compose run.
# Aqui, apenas iniciamos o servidor Rails.

echo "Starting Rails server..."
# Executa o comando principal do contêiner (bundle exec rails server -b 0.0.0.0 -p 3001)
exec "$@"