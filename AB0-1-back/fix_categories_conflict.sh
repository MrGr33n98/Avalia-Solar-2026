#!/bin/bash
set -e

echo "🚀 Iniciando correção de conflito do CategoriesController..."

# Caminho do controller duplicado
CONTROLLER_PATH="app/controllers/api/categories_controller.rb"

# 1. Backup do controller duplicado (se existir)
if [ -f "$CONTROLLER_PATH" ]; then
  echo "📦 Backup do controller duplicado em $CONTROLLER_PATH.bak"
  mv "$CONTROLLER_PATH" "$CONTROLLER_PATH.bak"
else
  echo "✅ Nenhum controller duplicado encontrado em $CONTROLLER_PATH"
fi

# 2. Ajustar rotas duplicadas no routes.rb
ROUTES_FILE="config/routes.rb"
if grep -q "resources :categories, only: \[:index, :show\]" $ROUTES_FILE; then
  echo "📝 Removendo rotas duplicadas de categorias fora do namespace v1..."
  sed -i.bak '/resources :categories, only: \[:index, :show\]/d' $ROUTES_FILE
else
  echo "✅ Nenhuma rota duplicada encontrada fora do namespace v1"
fi

# 3. Restart do servidor Rails (se estiver rodando com bin/rails)
if pgrep -f "rails s" > /dev/null; then
  echo "🛑 Parando servidor Rails..."
  pkill -f "rails s"
  sleep 2
fi

echo "🚀 Reiniciando servidor Rails em modo desenvolvimento..."
bin/rails s -p 3001 &

echo "✅ Conflito de CategoriesController corrigido!"
echo "👉 Agora rode: bin/rails routes | grep categories"
echo "👉 E teste: curl http://localhost:3001/api/v1/categories"
