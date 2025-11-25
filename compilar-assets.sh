#!/bin/bash

# Script para compilar assets do ActiveAdmin
# Execute este script NA VM após fazer deploy

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║   COMPILAÇÃO DE ASSETS - ACTIVEADMIN      ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se o container existe
if ! docker ps -a | grep -q "ab0-backend"; then
    echo -e "${RED}✗ Container ab0-backend não encontrado!${NC}"
    echo "Execute primeiro: docker-compose up -d"
    exit 1
fi

# Método 1: Compilar dentro do container em execução
echo -e "${BLUE}📦 Método 1: Compilando assets no container...${NC}"
echo ""

echo -e "${YELLOW}Limpando assets antigos...${NC}"
docker exec ab0-backend rm -rf public/assets/*

echo -e "${YELLOW}Compilando assets...${NC}"
docker exec ab0-backend bundle exec rails assets:precompile RAILS_ENV=production

echo -e "${GREEN}✓ Assets compilados!${NC}"
echo ""

# Verificar se os assets foram criados
echo -e "${BLUE}🔍 Verificando assets criados:${NC}"
ASSET_COUNT=$(docker exec ab0-backend ls -1 public/assets/ | wc -l)
echo "Total de arquivos: $ASSET_COUNT"

if [ "$ASSET_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Assets encontrados${NC}"
    
    # Verificar especificamente os assets do ActiveAdmin
    echo ""
    echo "Assets do ActiveAdmin:"
    docker exec ab0-backend ls -lh public/assets/ | grep "active_admin" || echo -e "${YELLOW}⚠ Assets do ActiveAdmin não encontrados${NC}"
else
    echo -e "${RED}✗ Nenhum asset foi compilado!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔄 Reiniciando backend para aplicar mudanças...${NC}"
docker-compose restart backend

echo ""
echo -e "${YELLOW}⏳ Aguardando backend reiniciar (15s)...${NC}"
sleep 15

echo ""
echo -e "${BLUE}🧪 Testando acesso ao ActiveAdmin...${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/admin/login 2>/dev/null || echo "ERROR")

if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✓ ActiveAdmin respondendo com sucesso!${NC}"
elif [ "$STATUS" = "302" ]; then
    echo -e "${GREEN}✓ ActiveAdmin redirect OK (302)${NC}"
else
    echo -e "${RED}✗ ActiveAdmin retornou status: $STATUS${NC}"
    echo ""
    echo "Verificando logs:"
    docker logs ab0-backend --tail 20
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              CONCLUÍDO!                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo "✅ Assets compilados com sucesso!"
echo ""
echo "🌐 Teste o ActiveAdmin:"
echo "  https://api.avaliasolar.com.br/admin/login"
echo ""
echo "📝 Se ainda houver erro, veja os logs:"
echo "  docker logs ab0-backend --tail 50"
echo ""
