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

# === CONFIGURAÇÃO DO BANCO DE DADOS ===

echo "🔧 Configurando banco de dados..."
bundle exec rails db:create || true

# Criar extensão PostgreSQL necessária
echo "🔧 Criando extensão btree_gin..."
psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS btree_gin;" 2>/dev/null || true

# Configurar ambiente Rails
echo "🔧 Configurando ambiente Rails..."
bundle exec rails db:environment:set RAILS_ENV=production || true

# Verificar se o banco precisa de setup inicial ou apenas migrations
TABLES_COUNT=$(bundle exec rails runner "puts ActiveRecord::Base.connection.tables.count rescue 0" 2>/dev/null || echo "0")
echo "📊 Tabelas encontradas: $TABLES_COUNT"

if [[ "$TABLES_COUNT" -gt 5 ]]; then
  echo "🔄 Banco já populado, executando migrações..."
  bundle exec rails db:migrate
else
  echo "🆕 Banco vazio/quase vazio, executando setup..."
  DISABLE_DATABASE_ENVIRONMENT_CHECK=1 bundle exec rails db:schema:load || true
  bundle exec rails db:seed || true
fi

# === INÍCIO DA APLICAÇÃO ===

echo "Starting Rails server..."
exec "$@"