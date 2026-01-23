#!/bin/bash
# Script simplificado para correção de credenciais S3 na VM
# Para usar: Copie e cole todo o conteúdo deste arquivo no terminal da VM

# Configurações fixas (edite conforme necessário)
BUCKET_NAME="avalia-backups"
REGION="nyc3"
ENDPOINT="https://${REGION}.digitaloceanspaces.com"

# Verificar se está no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Navegue até o diretório do projeto (/root/Avalia-Solar-2026) e execute novamente!"
    exit 1
fi

echo "🔧 CONFIGURAÇÃO RÁPIDA DO S3/SPACES"
echo "===================================="
echo ""

# Pedir credenciais
echo "📋 INSIRA AS CREDENCIAIS DO DIGITALOCEAN SPACES"
echo "----------------------------------------"
echo "Obtenha as credenciais em: https://cloud.digitalocean.com/spaces"
echo "→ Manage Keys → Spaces access keys"
echo ""
read -p "SPACES_ACCESS_KEY_ID: " ACCESS_KEY
read -sp "SPACES_SECRET_ACCESS_KEY: " SECRET_KEY
echo ""

# Validar credenciais
if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
    echo "❌ Credenciais vazias! Abortando."
    exit 1
fi

# Backup do .env
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do .env criado"
fi

# Atualizar variáveis no .env
echo "📋 ATUALIZANDO ARQUIVO .env"
echo "----------------------------------------"

# Função para atualizar variáveis
update_var() {
    local key="$1"
    local value="$2"
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

# Atualizar todas as variáveis
update_var "SPACES_ACCESS_KEY_ID" "$ACCESS_KEY"
update_var "SPACES_SECRET_ACCESS_KEY" "$SECRET_KEY"
update_var "SPACES_BUCKET" "$BUCKET_NAME"
update_var "SPACES_REGION" "$REGION"
update_var "SPACES_ENDPOINT" "$ENDPOINT"
update_var "ACTIVE_STORAGE_SERVICE" "spaces"

echo "✅ Variáveis atualizadas com sucesso!"
echo ""

# Reiniciar serviços
echo "📋 REINICIANDO SERVIÇOS DOCKER"
echo "----------------------------------------"
echo "Parando containers..."
docker-compose down

echo "Iniciando containers com novas configurações..."
docker-compose up -d

echo "✅ Containers reiniciados!"
echo ""

# Verificar logs
echo "📋 VERIFICANDO LOGS DO BACKEND"
echo "----------------------------------------"
sleep 5
echo "Últimas 20 linhas de log (filtro: storage/s3/spaces/error):"
docker-compose logs --tail=20 backend | grep -i "storage\|s3\|spaces\|error" || echo "✅ Nenhum erro encontrado!"
echo ""

# Exibir status dos containers
echo "📋 STATUS DOS CONTAINERS"
echo "----------------------------------------"
docker-compose ps
echo ""

echo "===================================="
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "===================================="
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo "1. Testar upload no admin: https://api.avaliasolar.com.br/admin"
echo "2. Monitorar logs em tempo real: docker-compose logs -f backend"
echo "3. Verificar configuração do CORS no bucket no DigitalOcean"
echo ""
echo "💡 Se houver problemas, verifique:"
echo "   - Credenciais corretas no DigitalOcean"
echo "   - Bucket '${BUCKET_NAME}' existe na região '${REGION}'"
echo "   - Permissões do bucket"
echo ""
