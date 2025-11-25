#!/bin/bash

# Script de Deploy Rápido para VPS
# Autor: Sistema de Diagnóstico
# Data: 2024

echo "🚀 DEPLOY RÁPIDO - CORREÇÃO DE CONFIGURAÇÃO"
echo "==========================================="
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ Erro: docker-compose.yml não encontrado!${NC}"
    echo "Execute este script no diretório raiz do projeto."
    exit 1
fi

echo -e "${BLUE}Passo 1: Parando containers...${NC}"
docker-compose down
echo ""

echo -e "${BLUE}Passo 2: Fazendo backup dos logs atuais...${NC}"
mkdir -p logs_backup
docker logs ab0-frontend > logs_backup/frontend_$(date +%Y%m%d_%H%M%S).log 2>&1 || true
docker logs ab0-backend > logs_backup/backend_$(date +%Y%m%d_%H%M%S).log 2>&1 || true
echo -e "${GREEN}✓ Logs salvos em logs_backup/${NC}"
echo ""

echo -e "${BLUE}Passo 3: Removendo containers antigos...${NC}"
docker rm -f ab0-frontend ab0-backend 2>/dev/null || true
echo ""

echo -e "${BLUE}Passo 4: Rebuild do frontend (com novas variáveis)...${NC}"
echo "⚠️  Isto pode levar alguns minutos..."
docker-compose build --no-cache frontend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend rebuilt com sucesso${NC}"
else
    echo -e "${RED}✗ Erro no rebuild do frontend${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Passo 5: Rebuild do backend (com novas variáveis CORS)...${NC}"
docker-compose build --no-cache backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend rebuilt com sucesso${NC}"
else
    echo -e "${RED}✗ Erro no rebuild do backend${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Passo 6: Iniciando containers...${NC}"
docker-compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers iniciados${NC}"
else
    echo -e "${RED}✗ Erro ao iniciar containers${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Passo 7: Aguardando containers ficarem prontos (30s)...${NC}"
sleep 30
echo ""

echo -e "${BLUE}Passo 8: Verificando status dos containers...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "ab0-"
echo ""

echo -e "${BLUE}Passo 9: Verificando variáveis de ambiente do FRONTEND...${NC}"
echo "NEXT_PUBLIC_API_URL:"
docker exec ab0-frontend printenv NEXT_PUBLIC_API_URL 2>/dev/null || echo "Variável não encontrada"
echo "NEXT_PUBLIC_SITE_URL:"
docker exec ab0-frontend printenv NEXT_PUBLIC_SITE_URL 2>/dev/null || echo "Variável não encontrada"
echo ""

echo -e "${BLUE}Passo 10: Verificando variáveis de ambiente do BACKEND...${NC}"
echo "CORS_ORIGINS:"
docker exec ab0-backend printenv CORS_ORIGINS 2>/dev/null || echo "Variável não encontrada"
echo ""

echo -e "${BLUE}Passo 11: Testando healthcheck...${NC}"
echo "Frontend:"
docker exec ab0-frontend curl -f http://localhost:3000 -o /dev/null -s -w "Status: %{http_code}\n" 2>/dev/null || echo "Erro"
echo "Backend:"
docker exec ab0-backend curl -f http://localhost:3001/health -o /dev/null -s -w "Status: %{http_code}\n" 2>/dev/null || echo "Erro"
echo ""

echo -e "${BLUE}Passo 12: Compilando assets do ActiveAdmin...${NC}"
echo "Limpando assets antigos..."
docker exec ab0-backend rm -rf public/assets/* 2>/dev/null || true
echo "Compilando assets..."
docker exec ab0-backend bundle exec rails assets:precompile RAILS_ENV=production
ASSET_COUNT=$(docker exec ab0-backend ls -1 public/assets/ 2>/dev/null | wc -l)
echo -e "${GREEN}✓ $ASSET_COUNT assets compilados${NC}"
echo ""

echo -e "${BLUE}Passo 13: Reiniciando backend para aplicar assets...${NC}"
docker-compose restart backend
echo "Aguardando 10 segundos..."
sleep 10
echo ""

echo "==========================================="
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo ""
echo "📋 Comandos úteis:"
echo "  Ver logs frontend:  docker logs -f ab0-frontend"
echo "  Ver logs backend:   docker logs -f ab0-backend"
echo "  Status containers:  docker ps"
echo "  Reiniciar:          docker-compose restart"
echo ""
echo "🧪 Execute o script de validação:"
echo "  ./validate-config.sh"
echo ""
echo "🌐 URLs para testar:"
echo "  Frontend: https://avaliasolar.com.br"
echo "  Backend:  https://api.avaliasolar.com.br/health"
