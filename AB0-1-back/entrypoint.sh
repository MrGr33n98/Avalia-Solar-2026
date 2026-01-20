#!/bin/bash
set -e

# Remove o arquivo server.pid para evitar falhas de inicialização do Rails
rm -f tmp/pids/server.pid

# === CONFIGURAÇÃO E ESPERA PELO BANCO DE DADOS ===

# Limpa e exporta variáveis de ambiente para o 'psql'
export PGPASSWORD=$(echo "${POSTGRES_PASSWORD}" | tr -d '\n\r')

POSTGRES_HOST=$(echo "${POSTGRES_HOST}" | tr -d '\n\r')
POSTGRES_USER=$(echo "${POSTGRES_USER}" | tr -d '\n\r')
POSTGRES_DB=$(echo "${POSTGRES_DB}" | tr -d '\n\r')

echo "⏳ Aguardando o Postgres em $POSTGRES_HOST (User: $POSTGRES_USER, DB: $POSTGRES_DB)..."

max_retries=30
count=0
until psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' > /dev/null 2>&1; do
  count=$((count + 1))
  if [ $count -gt $max_retries ]; then
    echo "❌ Erro: Postgres não ficou disponível após $max_retries tentativas."
    exit 1
  fi
  echo "Postgres não disponível ainda ($count/$max_retries) - tentando novamente..."
  sleep 2
done

echo "✅ Postgres disponível!"

# === CONFIGURAÇÃO DO BANCO DE DADOS ===

echo "🔧 Configurando banco de dados..."
bundle exec rails db:create || echo "⚠️ db:create falhou (pode já existir)"

# Tentar criar extensões necessárias (requer superuser, pode falhar mas o deploy continua)
echo "🔧 Tentando criar extensões PostgreSQL..."
psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS btree_gin;" > /dev/null 2>&1 || true
psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" > /dev/null 2>&1 || true

# Configurar ambiente Rails
echo "🔧 Configurando ambiente Rails..."
bundle exec rails db:environment:set RAILS_ENV=production || true

# Verificar se o banco precisa de setup inicial ou apenas migrations
echo "📊 Verificando estado do banco..."
TABLES_COUNT=$(bundle exec rails runner "puts ActiveRecord::Base.connection.tables.count rescue 0" 2>/dev/null || echo "0")
echo "📊 Tabelas encontradas: $TABLES_COUNT"

if [ "$TABLES_COUNT" -gt 5 ]; then
  echo "🔄 Banco já populado, executando migrações..."
  bundle exec rails db:migrate
else
  echo "🆕 Banco vazio/quase vazio (tabelas: $TABLES_COUNT), executando setup..."
  # Usa schema:load para garantir que o schema.rb corrigido seja aplicado
  DISABLE_DATABASE_ENVIRONMENT_CHECK=1 bundle exec rails db:schema:load
  bundle exec rails db:seed || echo "⚠️ Seed falhou, mas continuando..."
fi

# === INÍCIO DA APLICAÇÃO ===

echo "🔍 Verificando boot do Rails..."
bundle exec rails runner "puts '✅ Rails boot check passed'" || { echo "❌ Rails boot falhou"; exit 1; }

echo "Starting Rails server..."
exec "$@"