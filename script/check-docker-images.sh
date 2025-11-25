#!/bin/bash

# Função para verificar se uma imagem Docker existe
check_docker_image() {
    local image="$1"
    local max_retries=5
    local retry_delay=10
    local attempt=1

    echo "🔍 Verificando imagem: $image"

    while [ $attempt -le $max_retries ]; do
        echo "Tentativa $attempt de $max_retries..."

        if docker pull "$image" >/dev/null 2>&1; then
            echo "✅ Imagem $image encontrada"
            # Limpar a imagem para economizar espaço
            docker rmi "$image" >/dev/null 2>&1 || true
            return 0
        else
            echo "⚠️ Tentativa $attempt falhou. Aguardando $retry_delay segundos..."
            sleep $retry_delay
            attempt=$((attempt + 1))
        fi
    done

    echo "❌ Imagem $image não encontrada após $max_retries tentativas"
    return 1
}

# Função principal para verificar todas as imagens necessárias
check_all_images() {
    local registry="$1"
    local repo="$2"
    local images=("$registry/$repo-backend:latest" "$registry/$repo-frontend:latest")
    local all_success=true

    echo "🚀 Iniciando verificação de imagens..."

    for image in "${images[@]}"; do
        if ! check_docker_image "$image"; then
            all_success=false
            echo "❌ Falha ao verificar $image"
        fi
    done

    if [ "$all_success" = true ]; then
        echo "✅ Todas as imagens verificadas com sucesso"
        return 0
    else
        echo "❌ Falha na verificação de uma ou mais imagens"
        return 1
    fi
}

# Uso: ./check-docker-images.sh ghcr.io felipemorais/ab0-1
if [ $# -ne 2 ]; then
    echo "Uso: $0 <registry> <repository>"
    exit 1
}

check_all_images "$1" "$2"