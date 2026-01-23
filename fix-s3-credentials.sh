#!/bin/bash
# Script para corrigir credenciais S3/DigitalOcean Spaces
# Autor: Sistema de Diagnóstico AB0-1
# Data: 2026-01-22

set -e

echo "🔧 CORREÇÃO DE CREDENCIAIS S3/SPACES - AB0-1"
echo "=============================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para validar credenciais
validate_credentials() {
    local access_key="$1"
    local secret_key="$2"
    
    if [ -z "$access_key" ] || [ -z "$secret_key" ]; then
        echo -e "${RED}❌ Credenciais vazias!${NC}"
        return 1
    fi
    
    if [ ${#access_key} -lt 10 ]; then
        echo -e "${RED}❌ Access Key muito curta (mínimo 10 caracteres)${NC}"
        return 1
    fi
    
    if [ ${#secret_key} -lt 20 ]; then
        echo -e "${RED}❌ Secret Key muito curta (mínimo 20 caracteres)${NC}"
        return 1
    fi
    
    return 0
}

# Verificar se está na VM
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Este script deve ser executado no diretório raiz do projeto!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 PASSO 1: Verificando credenciais atuais${NC}"
echo "-------------------------------------------"

# Backup do .env atual
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup criado${NC}"
fi

# Verificar credenciais no .env
if [ -f ".env" ]; then
    CURRENT_ACCESS_KEY=$(grep "^SPACES_ACCESS_KEY_ID=" .env | cut -d '=' -f2)
    CURRENT_SECRET_KEY=$(grep "^SPACES_SECRET_ACCESS_KEY=" .env | cut -d '=' -f2)
    
    echo "Access Key ID atual: ${CURRENT_ACCESS_KEY:0:10}..."
    echo "Secret Key atual: ${CURRENT_SECRET_KEY:0:10}..."
else
    echo -e "${RED}❌ Arquivo .env não encontrado!${NC}"
    CURRENT_ACCESS_KEY=""
    CURRENT_SECRET_KEY=""
fi

echo ""
echo -e "${YELLOW}📋 PASSO 2: Inserir novas credenciais${NC}"
echo "-------------------------------------------"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Obtenha as credenciais corretas em:${NC}"
echo "   https://cloud.digitalocean.com/spaces"
echo "   → Manage Keys → Spaces access keys"
echo ""

# Solicitar novas credenciais
read -p "Digite o SPACES_ACCESS_KEY_ID: " NEW_ACCESS_KEY
read -sp "Digite o SPACES_SECRET_ACCESS_KEY: " NEW_SECRET_KEY
echo ""

# Validar credenciais
if ! validate_credentials "$NEW_ACCESS_KEY" "$NEW_SECRET_KEY"; then
    echo -e "${RED}❌ Credenciais inválidas! Abortando...${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 PASSO 3: Configurar bucket e região${NC}"
echo "-------------------------------------------"

read -p "Nome do bucket [avalia-solar-assets]: " BUCKET_NAME
BUCKET_NAME=${BUCKET_NAME:-avalia-solar-assets}

read -p "Região do Spaces [nyc3]: " REGION
REGION=${REGION:-nyc3}

ENDPOINT="https://${REGION}.digitaloceanspaces.com"

echo ""
echo -e "${YELLOW}📋 PASSO 4: Atualizar arquivo .env${NC}"
echo "-------------------------------------------"

# Atualizar ou adicionar variáveis no .env
update_env_var() {
    local key="$1"
    local value="$2"
    
    if grep -q "^${key}=" .env 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

# Atualizar credenciais
update_env_var "SPACES_ACCESS_KEY_ID" "$NEW_ACCESS_KEY"
update_env_var "SPACES_SECRET_ACCESS_KEY" "$NEW_SECRET_KEY"
update_env_var "SPACES_BUCKET" "$BUCKET_NAME"
update_env_var "SPACES_REGION" "$REGION"
update_env_var "SPACES_ENDPOINT" "$ENDPOINT"
update_env_var "ACTIVE_STORAGE_SERVICE" "spaces"

echo -e "${GREEN}✅ Variáveis atualizadas no .env${NC}"

echo ""
echo -e "${YELLOW}📋 PASSO 5: Testar conectividade com Spaces${NC}"
echo "-------------------------------------------"

# Testar com curl se o bucket existe
BUCKET_URL="https://${BUCKET_NAME}.${REGION}.digitaloceanspaces.com"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BUCKET_URL")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✅ Bucket acessível (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Bucket não encontrado (HTTP $HTTP_CODE)${NC}"
    echo -e "${YELLOW}⚠️  Verifique se o bucket '$BUCKET_NAME' existe no Spaces${NC}"
fi

echo ""
echo -e "${YELLOW}📋 PASSO 6: Reiniciar serviços Docker${NC}"
echo "-------------------------------------------"

echo "Parando containers..."
docker-compose down

echo "Removendo volumes (opcional - preserva dados)..."
read -p "Remover volumes? (s/N): " REMOVE_VOLUMES
if [ "$REMOVE_VOLUMES" = "s" ] || [ "$REMOVE_VOLUMES" = "S" ]; then
    docker-compose down -v
fi

echo "Iniciando containers com novas credenciais..."
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Containers reiniciados${NC}"

echo ""
echo -e "${YELLOW}📋 PASSO 7: Verificar logs${NC}"
echo "-------------------------------------------"

sleep 5
echo "Últimas 20 linhas do log do backend:"
docker-compose logs --tail=20 backend | grep -i "storage\|s3\|spaces\|error" || echo "Nenhum erro encontrado"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ CORREÇÃO CONCLUÍDA${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
echo "1. Testar upload no admin: https://api.avaliasolar.com.br/admin"
echo "2. Monitorar logs: docker-compose logs -f ab0-backend"
echo "3. Se persistir erro, verificar:"
echo "   - Permissões do bucket no Spaces"
echo "   - CORS configurado no bucket"
echo "   - Firewall da DigitalOcean"
echo ""
echo -e "${YELLOW}📄 Arquivos de backup criados:${NC}"
ls -lh .env.backup.* 2>/dev/null || echo "Nenhum backup anterior"
echo ""
