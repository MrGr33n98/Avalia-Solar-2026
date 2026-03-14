#!/bin/bash

# replicate.sh
# Script para instanciar um novo projeto a partir de um blueprint.
# Uso: ./replicate.sh <nome-do-novo-projeto>

set -e

if [ -z "$1" ]; then
  echo "Uso: ./replicate.sh <nome-do-novo-projeto>"
  echo "Exemplo: ./replicate.sh meu-novo-ecommerce"
  exit 1
fi

NEW_PROJECT=$1
BLUEPRINT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/novos-projetos/$NEW_PROJECT"

# Conversões de string
# meu-novo-ecommerce -> meu_novo_ecommerce
PROJECT_SNAKE=$(echo "$NEW_PROJECT" | tr '-' '_')
# meu_novo_ecommerce -> MEU_NOVO_ECOMMERCE
PROJECT_UPPER=$(echo "$PROJECT_SNAKE" | tr '[:lower:]' '[:upper:]')
# meu-novo-ecommerce -> MeuNovoEcommerce (Aproximação de CamelCase/PascalCase)
PROJECT_PASCAL=$(echo "$NEW_PROJECT" | awk -F'-' '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))} 1' OFS='')

echo "🚀 Instanciando novo projeto: $NEW_PROJECT em $TARGET_DIR"

mkdir -p "$TARGET_DIR"

# 1. Copiar base (excluindo os scripts do blueprint)
echo "📦 Copiando arquivos do blueprint..."
rsync -a --exclude="replicate.sh" --exclude="README.md" "$BLUEPRINT_DIR/" "$TARGET_DIR/"

# 2. Renomear pastas, se necessário
mv "$TARGET_DIR/back-end" "$TARGET_DIR/${NEW_PROJECT}-back" 2>/dev/null || true
mv "$TARGET_DIR/front-end" "$TARGET_DIR/${NEW_PROJECT}-front" 2>/dev/null || true

# 3. Substituir os Placeholders pelos nomes reais
echo "⚙️ Configurando o projeto com os novos nomes..."

sedi() {
  if sed --version >/dev/null 2>&1; then
    sed -i "$@"
  else
    sed -i '' "$@"
  fi
}
export -f sedi

# Troca geral em todos os arquivos permitidos
find "$TARGET_DIR" -type f \( -name "*.rb" -o -name "*.yml" -o -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" -o -name "Dockerfile*" -o -name "Gemfile*" -o -name "*.sh" \) -exec bash -c '
  sedi "s/{{PROJECT_NAME_KEBAB}}/'"$NEW_PROJECT"'/g" "$0";
  sedi "s/{{PROJECT_NAME_SNAKE}}/'"$PROJECT_SNAKE"'/g" "$0";
  sedi "s/{{PROJECT_NAME_UPPER}}/'"$PROJECT_UPPER"'/g" "$0";
  sedi "s/{{PROJECT_NAME_PASCAL}}/'"$PROJECT_PASCAL"'/g" "$0";
' {} \;

echo "✅ Instanciação concluída! Seu projeto está em: $TARGET_DIR"
echo ""
echo "Próximos passos recomendados:"
echo "1. cd $TARGET_DIR/${NEW_PROJECT}-back"
echo "2. bundle install && rails db:create db:migrate"
echo "3. cd ../${NEW_PROJECT}-front"
echo "4. npm install (ou yarn/pnpm install)"
echo "5. Boa programação! 🎉"
