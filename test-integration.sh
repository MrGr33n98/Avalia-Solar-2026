#!/bin/bash

# ================================================
# Script de Teste de Integração
# ================================================

echo "🔍 Verificando Integração Backend + Frontend"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Backend (Rails)
echo "1️⃣ Verificando Backend Rails (porta 3001)..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend Rails está rodando!${NC}"
    BACKEND_RUNNING=true
else
    echo -e "${RED}❌ Backend Rails NÃO está rodando!${NC}"
    echo -e "${YELLOW}   Inicie com: cd AB0-1-back && rails server -p 3001${NC}"
    BACKEND_RUNNING=false
fi
echo ""

# Check Frontend (Next.js)
echo "2️⃣ Verificando Frontend Next.js (porta 3000)..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Frontend Next.js está rodando!${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}❌ Frontend Next.js NÃO está rodando!${NC}"
    echo -e "${YELLOW}   Inicie com: cd AB0-1-front && npm run dev${NC}"
    FRONTEND_RUNNING=false
fi
echo ""

# Test API Endpoint
echo "3️⃣ Testando endpoint de API..."
if [ "$BACKEND_RUNNING" = true ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/v1/companies)
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ API respondendo corretamente (HTTP $HTTP_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  API respondeu com HTTP $HTTP_CODE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Não foi possível testar (backend não está rodando)${NC}"
fi
echo ""

# Check Files
echo "4️⃣ Verificando arquivos criados..."

FILES=(
    "AB0-1-front/lib/api-analytics.ts"
    "AB0-1-front/app/dashboard/components/AdvancedAnalyticsIntegrated.tsx"
    "AB0-1-back/ANALYTICS_ENDPOINTS_IMPLEMENTATION.rb"
    "BACKEND_INTEGRATION_GUIDE.md"
    "INTEGRACAO_COMPLETA_RESUMO.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $file"
    else
        echo -e "${RED}❌${NC} $file (não encontrado)"
    fi
done
echo ""

# Summary
echo "📊 RESUMO"
echo "=============================================="
if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Tudo pronto para testar!${NC}"
    echo ""
    echo "🌐 Acesse: http://localhost:3000/dashboard/company"
    echo "📊 Clique na aba 'Analytics' (com badge PRO)"
elif [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${YELLOW}⚠️  Backend OK, mas Frontend precisa iniciar${NC}"
    echo ""
    echo "Execute: cd AB0-1-front && npm run dev"
elif [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${YELLOW}⚠️  Frontend OK, mas Backend precisa iniciar${NC}"
    echo ""
    echo "Execute: cd AB0-1-back && rails server -p 3001"
else
    echo -e "${RED}❌ Nenhum servidor está rodando${NC}"
    echo ""
    echo "Inicie os servidores:"
    echo "  Terminal 1: cd AB0-1-back && rails server -p 3001"
    echo "  Terminal 2: cd AB0-1-front && npm run dev"
fi
echo ""

# Next Steps
echo "📚 PRÓXIMOS PASSOS"
echo "=============================================="
echo "1. Leia: INTEGRACAO_COMPLETA_RESUMO.md"
echo "2. Implemente os endpoints no Rails"
echo "3. Veja: AB0-1-back/ANALYTICS_ENDPOINTS_IMPLEMENTATION.rb"
echo "4. Teste a integração no navegador"
echo ""
