#!/bin/bash

# Script de Validação GA4 - Produção
# Uso: ./test_ga4_prod.sh

# Cores para o output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Iniciando Validação do GA4 em Produção...${NC}\n"

# 1. Verificar se os containers estão rodando
echo -e "${YELLOW}[1/4] Verificando containers do Docker...${NC}"
if docker ps | grep -q "ab0-backend" && docker ps | grep -q "ab0-frontend"; then
    echo -e "${GREEN}✅ Containers ab0-backend e ab0-frontend estão ativos.${NC}"
else
    echo -e "${RED}❌ Um ou mais containers não estão rodando. Verifique com 'docker ps'.${NC}"
    exit 1
fi

# 2. Validar variáveis de ambiente no Backend (API)
echo -e "\n${YELLOW}[2/4] Validando variáveis no Backend (Rails)...${NC}"
BE_MEASUREMENT_ID=$(docker exec ab0-backend rails runner "print ENV['GA4_MEASUREMENT_ID']" 2>/dev/null)
BE_API_SECRET=$(docker exec ab0-backend rails runner "print ENV['GA4_API_SECRET']" 2>/dev/null)

if [ "$BE_MEASUREMENT_ID" == "G-9SD4S6S434" ]; then
    echo -e "${GREEN}✅ GA4_MEASUREMENT_ID correta no Backend: $BE_MEASUREMENT_ID${NC}"
else
    echo -e "${RED}❌ GA4_MEASUREMENT_ID incorreta ou ausente no Backend!${NC}"
    echo -e "   Valor encontrado: $BE_MEASUREMENT_ID"
fi

if [ -n "$BE_API_SECRET" ]; then
    echo -e "${GREEN}✅ GA4_API_SECRET configurada no Backend.${NC}"
else
    echo -e "${RED}❌ GA4_API_SECRET ausente no Backend!${NC}"
fi

# 3. Validar variáveis de ambiente no Frontend (Next.js)
echo -e "\n${YELLOW}[3/4] Validando variáveis no Frontend (Next.js)...${NC}"
FE_MEASUREMENT_ID=$(docker exec ab0-frontend env | grep NEXT_PUBLIC_GA_MEASUREMENT_ID | cut -d'=' -f2)

if [ "$FE_MEASUREMENT_ID" == "G-9SD4S6S434" ]; then
    echo -e "${GREEN}✅ NEXT_PUBLIC_GA_MEASUREMENT_ID correta no Frontend: $FE_MEASUREMENT_ID${NC}"
else
    echo -e "${RED}❌ NEXT_PUBLIC_GA_MEASUREMENT_ID incorreta ou ausente no Frontend!${NC}"
    echo -e "   Dica: Variáveis NEXT_PUBLIC exigem rebuild do container para serem aplicadas.${NC}"
fi

# 4. Disparar Evento de Teste Real
echo -e "\n${YELLOW}[4/4] Disparando evento de teste Real-time...${NC}"
docker exec ab0-backend rails runner "Ga4Service.track('production_validation_success', { 
    source: 'automated_bash_script', 
    timestamp: Time.current.to_s,
    environment: 'production' 
})"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🚀 Evento 'production_validation_success' enviado!${NC}"
    echo -e "${YELLOW}👉 Verifique agora no GA4: Administrador > DebugView${NC}"
else
    echo -e "${RED}❌ Falha ao disparar evento de teste do backend.${NC}"
fi

echo -e "\n${YELLOW}--- Fim da Validação ---${NC}"
