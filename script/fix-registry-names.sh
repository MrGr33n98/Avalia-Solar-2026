#!/bin/bash

echo "🔧 Iniciando correção dos nomes dos registros..."

# Função para converter string para lowercase
to_lowercase() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Configurações
BACKEND_IMAGE="ghcr.io/felipemorais/ab0-1-backend"
FRONTEND_IMAGE="ghcr.io/felipemorais/ab0-1-frontend"

# Converte os nomes das imagens para minúsculas
BACKEND_IMAGE=$(to_lowercase "$BACKEND_IMAGE")
FRONTEND_IMAGE=$(to_lowercase "$FRONTEND_IMAGE")

# Função para atualizar as tags das imagens
update_image_tags() {
    local IMAGE_NAME=$1
    local CONTAINER_NAME=$2

    echo "📦 Atualizando tags para $CONTAINER_NAME..."

    # Lista todas as tags exceto 'latest', ordena e mantém apenas as 2 mais recentes
    TAGS=$(gh api /user/packages/container/$CONTAINER_NAME/versions --paginate | \
           jq -r '.[].metadata.container.tags[]' | \
           grep -v latest | sort -r)

    # Remove tags antigas
    echo "$TAGS" | tail -n +3 | while read -r tag; do
        echo "🗑️ Removendo tag antiga: $tag"
        gh api --method DELETE /user/packages/container/$CONTAINER_NAME/versions/$tag
    done

    echo "✅ Tags atualizadas para $CONTAINER_NAME"
}

# Atualiza as imagens
echo "🔄 Construindo e enviando imagens com nomes corrigidos..."

# Backend
echo "⚙️ Processando backend..."
docker build -t $BACKEND_IMAGE:latest -t $BACKEND_IMAGE:$GITHUB_SHA ./AB0-1-back
docker push $BACKEND_IMAGE:latest
docker push $BACKEND_IMAGE:$GITHUB_SHA
update_image_tags $BACKEND_IMAGE "ab0-1-backend"

# Frontend
echo "🎨 Processando frontend..."
docker build -t $FRONTEND_IMAGE:latest -t $FRONTEND_IMAGE:$GITHUB_SHA ./AB0-1-front
docker push $FRONTEND_IMAGE:latest
docker push $FRONTEND_IMAGE:$GITHUB_SHA
update_image_tags $FRONTEND_IMAGE "ab0-1-frontend"

echo "✨ Processo de correção concluído com sucesso!"