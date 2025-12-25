#!/bin/bash

# Script de teste para os novos endpoints de Categorias e Banners
# Uso: bash test-categories-refactor.sh

BASE_URL="${API_URL:-http://localhost:3001/api/v1}"

echo "🧪 Testando Refatoração da Página de Categorias"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo -e "${YELLOW}Testando:${NC} $description"
    echo "GET $BASE_URL$endpoint"
    
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Status: $http_code${NC}"
        echo "Resposta:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Status: $http_code${NC}"
        echo "Erro: $body"
    fi
    echo ""
    echo "---"
    echo ""
}

# Testes de Banners
echo "1️⃣  BANNERS"
echo ""

test_endpoint "/banners" "Todos os banners ativos"
test_endpoint "/banners?position=categories_top" "Banners da página de categorias"
test_endpoint "/banners?position=categories_top&limit=3" "Banners com limite"

# Testes de Categories
echo "2️⃣  CATEGORIAS"
echo ""

test_endpoint "/categories" "Categorias (modo legado)"
test_endpoint "/categories?view=cards" "Categorias (modo cards)"
test_endpoint "/categories?view=cards&featured=true" "Categorias em destaque"
test_endpoint "/categories?view=cards&featured=true&limit=8" "Categorias em destaque (limite 8)"

echo ""
echo "================================================"
echo "✅ Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "  - Se algum teste falhar, verifique se o backend está rodando"
echo "  - Verifique se há dados no banco (banners, categorias)"
echo "  - Logs do backend: tail -f AB0-1-back/log/development.log"
