#!/bin/bash

# generate-blueprint.sh
# Script para gerar um blueprint reutilizável a partir do projeto atual (Rails + Next.js)

set -e

if [ -z "$1" ]; then
  echo "Uso: ./generate-blueprint.sh <nome-do-blueprint>"
  echo "Exemplo: ./generate-blueprint.sh legaltech-stack"
  exit 1
fi

BLUEPRINT_NAME=$1
DEST_DIR="$HOME/blueprints/$BLUEPRINT_NAME"
CURRENT_DIR=$(pwd)

echo "🚀 Iniciando geração do blueprint: $BLUEPRINT_NAME..."

# 1. Criar estrutura de diretórios
mkdir -p "$DEST_DIR/back-end"
mkdir -p "$DEST_DIR/front-end"
mkdir -p "$DEST_DIR/infrastructure"

# 2. Copiar Backend (Rails), ignorando arquivos desnecessários
echo "📦 Copiando Back-end..."
rsync -av --exclude='.git' \
          --exclude='tmp/' \
          --exclude='log/' \
          --exclude='public/system/' \
          --exclude='storage/' \
          --exclude='node_modules/' \
          --exclude='vendor/' \
          --exclude='.env' \
          --exclude='.env.*' \
          --exclude='coverage/' \
          AB0-1-back/ "$DEST_DIR/back-end/"

# 3. Copiar Frontend (Next.js), ignorando arquivos desnecessários
echo "📦 Copiando Front-end..."
rsync -av --exclude='.git' \
          --exclude='.next/' \
          --exclude='node_modules/' \
          --exclude='out/' \
          --exclude='build/' \
          --exclude='.env' \
          --exclude='.env.*.local' \
          --exclude='coverage/' \
          AB0-1-front/ "$DEST_DIR/front-end/"

# 4. Copiar infraestrutura root
echo "📦 Copiando Infraestrutura e Configurações Root..."
cp docker-compose*.yml "$DEST_DIR/infrastructure/" 2>/dev/null || true
cp Makefile "$DEST_DIR/infrastructure/" 2>/dev/null || true
cp README.md "$DEST_DIR/blueprint-readme.md" 2>/dev/null || true

# 5. Limpeza e generalização (Substituindo nomes específicos por placeholders)
echo "🧹 Generalizando nomes (Substituindo AB0-1 por {{PROJECT_NAME}})..."

# Função cross-platform sed (Mac/Linux)
sedi() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}

export -f sedi

# Buscar e substituir no backend
find "$DEST_DIR/back-end" -type f \( -name "*.rb" -o -name "*.yml" -o -name "Gemfile*" -o -name "Dockerfile*" -o -name "*.sh" -o -name "*.json" \) -exec bash -c 'sedi "s/AB0_1/{{PROJECT_NAME_UPPER}}/g" "$0"; sedi "s/ab0_1/{{PROJECT_NAME_SNAKE}}/g" "$0"; sedi "s/AB0-1/{{PROJECT_NAME_KEBAB}}/g" "$0"' {} \;

# Buscar e substituir no frontend
find "$DEST_DIR/front-end" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" -o -name "Dockerfile*" -o -name "*.yml" \) -exec bash -c 'sedi "s/AB0-1/{{PROJECT_NAME_KEBAB}}/g" "$0"; sedi "s/ab0_1/{{PROJECT_NAME_SNAKE}}/g" "$0"' {} \;

# Buscar e substituir na infra
find "$DEST_DIR/infrastructure" -type f -exec bash -c 'sedi "s/AB0-1/{{PROJECT_NAME_KEBAB}}/g" "$0"; sedi "s/ab0_1/{{PROJECT_NAME_SNAKE}}/g" "$0"' {} \;

# 6. Copiar o script de replicação e a documentação para a pasta do blueprint
cp blueprint-tools/replicate.sh "$DEST_DIR/"
chmod +x "$DEST_DIR/replicate.sh"
cp blueprint-tools/README-BLUEPRINT.md "$DEST_DIR/README.md"

echo "✅ Blueprint '$BLUEPRINT_NAME' gerado com sucesso em: $DEST_DIR"
echo "Para criar um novo projeto a partir deste blueprint, execute:"
echo "$DEST_DIR/replicate.sh <novo-nome-do-projeto>"
