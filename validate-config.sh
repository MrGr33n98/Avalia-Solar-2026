#!/bin/bash

# Script de validação de configuração e testes
# Autor: Sistema de Diagnóstico
# Data: 2024

echo "🔍 VALIDAÇÃO DE CONFIGURAÇÃO - AVALIASOLAR"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar sucesso
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1${NC}"
        return 1
    fi
}

# 1. Verificar se os containers estão rodando
echo "1️⃣  Verificando containers..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "ab0-(frontend|backend|postgres|redis)"
check_status "Containers listados"
echo ""

# 2. Testar API do host
echo "2️⃣  Testando API do host (https://api.avaliasolar.com.br/health)..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.avaliasolar.com.br/health 2>/dev/null || echo "ERROR")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ API respondendo com status 200${NC}"
elif [ "$HEALTH_RESPONSE" = "ERROR" ]; then
    echo -e "${RED}✗ Erro ao conectar à API (verifique DNS/firewall)${NC}"
else
    echo -e "${YELLOW}⚠ API respondeu com status $HEALTH_RESPONSE${NC}"
fi
echo ""

# 3. Testar API do container frontend
echo "3️⃣  Testando API do container frontend..."
docker exec ab0-frontend curl -s -o /dev/null -w "Status: %{http_code}\n" https://api.avaliasolar.com.br/health 2>/dev/null
check_status "Teste do container frontend"
echo ""

# 4. Verificar variáveis de ambiente do frontend
echo "4️⃣  Verificando variáveis de ambiente do FRONTEND..."
echo "NEXT_PUBLIC_API_URL:"
docker exec ab0-frontend printenv NEXT_PUBLIC_API_URL 2>/dev/null || echo "Variável não encontrada"
echo "NEXT_PUBLIC_SITE_URL:"
docker exec ab0-frontend printenv NEXT_PUBLIC_SITE_URL 2>/dev/null || echo "Variável não encontrada"
echo ""

# 5. Verificar variáveis de ambiente do backend
echo "5️⃣  Verificando variáveis de ambiente do BACKEND..."
echo "CORS_ORIGINS:"
docker exec ab0-backend printenv CORS_ORIGINS 2>/dev/null || echo "Variável não encontrada"
echo "RAILS_ENV:"
docker exec ab0-backend printenv RAILS_ENV 2>/dev/null || echo "Variável não encontrada"
echo ""

# 6. Testar CORS
echo "6️⃣  Testando configuração CORS..."
echo "Testando origin: https://avaliasolar.com.br"
CORS_TEST=$(curl -s -H "Origin: https://avaliasolar.com.br" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     -I https://api.avaliasolar.com.br/api/v1/health 2>/dev/null | grep -i "access-control-allow-origin")
if [ -n "$CORS_TEST" ]; then
    echo -e "${GREEN}✓ CORS configurado: $CORS_TEST${NC}"
else
    echo -e "${RED}✗ CORS não está permitindo a origem${NC}"
fi
echo ""

# 7. Verificar logs recentes do frontend
echo "7️⃣  Últimas 10 linhas do log do FRONTEND..."
docker logs ab0-frontend --tail 10 2>&1 | head -10
echo ""

# 8. Verificar logs recentes do backend
echo "8️⃣  Últimas 10 linhas do log do BACKEND..."
docker logs ab0-backend --tail 10 2>&1 | head -10
echo ""

# 9. Verificar healthcheck status
echo "9️⃣  Status de healthcheck dos containers..."
docker inspect ab0-frontend --format='{{.State.Health.Status}}' 2>/dev/null || echo "Healthcheck não configurado"
docker inspect ab0-backend --format='{{.State.Health.Status}}' 2>/dev/null || echo "Healthcheck não configurado"
echo ""

# 10. Testar conectividade interna
echo "🔟 Testando conectividade interna (frontend -> backend)..."
docker exec ab0-frontend curl -s -o /dev/null -w "Status: %{http_code}\n" http://backend:3001/health 2>/dev/null
check_status "Conectividade interna"
echo ""

echo "=========================================="
echo "✅ Validação concluída!"
echo ""
echo "📋 Próximos passos se houver problemas:"
echo "  1. Verificar logs completos: docker logs ab0-frontend"
echo "  2. Verificar logs completos: docker logs ab0-backend"
echo "  3. Rebuild containers: docker-compose build --no-cache"
echo "  4. Restart containers: docker-compose down && docker-compose up -d"
echo "  5. Verificar DNS: nslookup api.avaliasolar.com.br"
echo "  6. Verificar firewall: ufw status"
echo "  7. Verificar nginx/caddy: systemctl status nginx"
