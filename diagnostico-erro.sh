#!/bin/bash

# Script de Diagnóstico Rápido - Erro Backend
# Execute na VM via SSH

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  DIAGNÓSTICO DE ERRO - BACKEND RAILS  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# 1. Status dos containers
echo -e "${YELLOW}📦 1. Status dos Containers:${NC}"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ab0
echo ""

# 2. Verificar se backend está rodando
if docker ps | grep -q "ab0-backend.*Up"; then
    echo -e "${GREEN}✓ Backend está rodando${NC}"
else
    echo -e "${RED}✗ Backend NÃO está rodando!${NC}"
    echo "Execute: docker-compose up -d backend"
    exit 1
fi
echo ""

# 3. Testar health endpoint local
echo -e "${YELLOW}🏥 2. Testando Health Endpoint (interno):${NC}"
HEALTH_STATUS=$(docker exec ab0-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "ERROR")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health endpoint OK (200)${NC}"
else
    echo -e "${RED}✗ Health endpoint FALHOU (Status: $HEALTH_STATUS)${NC}"
fi
echo ""

# 4. Verificar logs recentes
echo -e "${YELLOW}📋 3. Últimos Erros nos Logs:${NC}"
echo "Procurando por: ERROR, EXCEPTION, FATAL..."
docker logs ab0-backend 2>&1 | grep -i "error\|exception\|fatal" | tail -10 | while read line; do
    echo -e "${RED}  $line${NC}"
done
echo ""

# 5. Variáveis de ambiente críticas
echo -e "${YELLOW}🔐 4. Variáveis de Ambiente Críticas:${NC}"
echo -n "RAILS_ENV: "
docker exec ab0-backend printenv RAILS_ENV 2>/dev/null || echo -e "${RED}NÃO DEFINIDA${NC}"

echo -n "DATABASE_URL: "
DB_URL=$(docker exec ab0-backend printenv DATABASE_URL 2>/dev/null)
if [ -n "$DB_URL" ]; then
    echo -e "${GREEN}Definida${NC}"
else
    echo -e "${RED}NÃO DEFINIDA${NC}"
fi

echo -n "RAILS_MASTER_KEY: "
MASTER_KEY=$(docker exec ab0-backend printenv RAILS_MASTER_KEY 2>/dev/null)
if [ -n "$MASTER_KEY" ] && [ ${#MASTER_KEY} -eq 32 ]; then
    echo -e "${GREEN}Definida (32 caracteres)${NC}"
else
    echo -e "${RED}NÃO DEFINIDA ou INVÁLIDA${NC}"
fi

echo -n "SECRET_KEY_BASE: "
SECRET=$(docker exec ab0-backend printenv SECRET_KEY_BASE 2>/dev/null)
if [ -n "$SECRET" ]; then
    echo -e "${GREEN}Definida${NC}"
else
    echo -e "${RED}NÃO DEFINIDA${NC}"
fi
echo ""

# 6. Testar conexão com banco
echo -e "${YELLOW}🗄️  5. Testando Conexão com Banco de Dados:${NC}"
DB_TEST=$(docker exec ab0-backend rails runner "puts ActiveRecord::Base.connection.active?" 2>&1)
if echo "$DB_TEST" | grep -q "true"; then
    echo -e "${GREEN}✓ Conexão com banco OK${NC}"
else
    echo -e "${RED}✗ Falha na conexão com banco!${NC}"
    echo "Erro: $DB_TEST"
fi
echo ""

# 7. Verificar migrations
echo -e "${YELLOW}🔄 6. Status das Migrations:${NC}"
MIGRATIONS=$(docker exec ab0-backend rails db:migrate:status 2>&1 | tail -5)
if echo "$MIGRATIONS" | grep -q "down"; then
    echo -e "${RED}✗ Existem migrations pendentes!${NC}"
    echo "$MIGRATIONS"
    echo ""
    echo "Execute: docker exec ab0-backend rails db:migrate RAILS_ENV=production"
else
    echo -e "${GREEN}✓ Migrations OK${NC}"
fi
echo ""

# 8. Verificar assets
echo -e "${YELLOW}📦 7. Verificando Assets:${NC}"
ASSETS=$(docker exec ab0-backend ls public/assets 2>/dev/null | wc -l)
if [ "$ASSETS" -gt 0 ]; then
    echo -e "${GREEN}✓ Assets compilados ($ASSETS arquivos)${NC}"
else
    echo -e "${YELLOW}⚠ Nenhum asset encontrado (pode ser normal para API)${NC}"
fi
echo ""

# 9. Verificar espaço em disco
echo -e "${YELLOW}💾 8. Espaço em Disco:${NC}"
df -h / | tail -1 | awk '{print "  Usado: "$3" / Total: "$2" ("$5")"}'
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo -e "${RED}✗ ATENÇÃO: Disco quase cheio!${NC}"
else
    echo -e "${GREEN}✓ Espaço em disco OK${NC}"
fi
echo ""

# 10. Verificar memória
echo -e "${YELLOW}🧠 9. Memória Disponível:${NC}"
free -h | grep Mem | awk '{print "  Total: "$2" / Usado: "$3" / Livre: "$4}'
echo ""

# 11. Últimas 20 linhas do log
echo -e "${YELLOW}📜 10. Últimas 20 Linhas do Log:${NC}"
echo "─────────────────────────────────────────"
docker logs ab0-backend --tail 20 2>&1
echo "─────────────────────────────────────────"
echo ""

# RESUMO E SUGESTÕES
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           RESUMO E SUGESTÕES           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Análise dos problemas encontrados
PROBLEMS=0

if [ "$HEALTH_STATUS" != "200" ]; then
    echo -e "${RED}🔴 Problema: Health endpoint não responde${NC}"
    echo "   Solução: docker-compose restart backend"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ -z "$MASTER_KEY" ] || [ ${#MASTER_KEY} -ne 32 ]; then
    echo -e "${RED}🔴 Problema: RAILS_MASTER_KEY ausente ou inválida${NC}"
    echo "   Solução: Adicionar no .env:"
    echo "   RAILS_MASTER_KEY=926316d3121bac4b8751ada0031657ec"
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! echo "$DB_TEST" | grep -q "true"; then
    echo -e "${RED}🔴 Problema: Banco de dados inacessível${NC}"
    echo "   Solução: Verificar PostgreSQL e credenciais"
    echo "   1. docker-compose restart db"
    echo "   2. Verificar .env (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB)"
    PROBLEMS=$((PROBLEMS + 1))
fi

if echo "$MIGRATIONS" | grep -q "down"; then
    echo -e "${RED}🔴 Problema: Migrations pendentes${NC}"
    echo "   Solução: docker exec ab0-backend rails db:migrate RAILS_ENV=production"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ $PROBLEMS -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum problema crítico detectado!${NC}"
    echo ""
    echo "Se ainda houver erro, execute:"
    echo "  docker-compose restart backend"
    echo "  docker logs -f ab0-backend"
else
    echo ""
    echo -e "${YELLOW}Total de problemas encontrados: $PROBLEMS${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Para ver logs em tempo real:"
echo "  docker logs -f ab0-backend"
echo ""
echo "Para reiniciar o backend:"
echo "  docker-compose restart backend"
echo ""
echo "Para rebuild completo:"
echo "  ./deploy-fix.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
