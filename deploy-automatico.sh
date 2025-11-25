#!/bin/bash

# Script Automático de Deploy - Execute no seu MAC
# Este script copia os arquivos e executa o deploy automaticamente

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     🚀 DEPLOY AUTOMÁTICO - AVALIASOLAR                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================================
# CONFIGURAÇÃO
# ============================================================
echo -e "${YELLOW}📋 Configuração Inicial${NC}"
echo ""

# Solicitar IP da VPS
read -p "Digite o IP da sua VPS (ex: 64.225.59.107): " VPS_IP

if [ -z "$VPS_IP" ]; then
    echo -e "${RED}✗ IP não pode ser vazio!${NC}"
    exit 1
fi

echo ""
read -p "Digite o usuário SSH (padrão: root): " SSH_USER
SSH_USER=${SSH_USER:-root}

echo ""
read -p "Digite o caminho do projeto na VPS (padrão: /root/AB0-1): " VPS_PATH
VPS_PATH=${VPS_PATH:-/root/AB0-1}

echo ""
echo -e "${BLUE}Configuração:${NC}"
echo "  IP: $VPS_IP"
echo "  Usuário: $SSH_USER"
echo "  Caminho: $VPS_PATH"
echo ""
read -p "Confirma? (s/n): " CONFIRM

if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo -e "${YELLOW}Deploy cancelado.${NC}"
    exit 0
fi

# ============================================================
# TESTAR CONEXÃO SSH
# ============================================================
echo ""
echo -e "${BLUE}🔐 Testando conexão SSH...${NC}"
if ssh -o ConnectTimeout=10 -o BatchMode=yes $SSH_USER@$VPS_IP "echo OK" 2>/dev/null; then
    echo -e "${GREEN}✓ Conexão SSH OK${NC}"
else
    echo -e "${YELLOW}⚠ Conexão SSH requer senha ou chave${NC}"
    echo "Você precisará digitar a senha ou configurar chave SSH"
fi

# ============================================================
# COPIAR ARQUIVOS ESSENCIAIS
# ============================================================
echo ""
echo -e "${BLUE}📦 Copiando arquivos para a VPS...${NC}"
echo ""

LOCAL_DIR="/Users/felipemorais/AB0-1"
cd "$LOCAL_DIR"

# Array de arquivos para copiar
declare -A FILES=(
    ["docker-compose.yml"]="$VPS_PATH/"
    [".env"]="$VPS_PATH/"
    ["AB0-1-back/Dockerfile"]="$VPS_PATH/AB0-1-back/"
    ["AB0-1-front/.env.production"]="$VPS_PATH/AB0-1-front/"
    ["deploy-fix.sh"]="$VPS_PATH/"
    ["compilar-assets.sh"]="$VPS_PATH/"
    ["validate-config.sh"]="$VPS_PATH/"
    ["diagnostico-erro.sh"]="$VPS_PATH/"
)

for file in "${!FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -n "  Copiando $file... "
        if scp -q "$file" "$SSH_USER@$VPS_IP:${FILES[$file]}" 2>/dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${RED}✗${NC}"
            echo -e "${YELLOW}  Tentando novamente com senha...${NC}"
            scp "$file" "$SSH_USER@$VPS_IP:${FILES[$file]}"
        fi
    else
        echo -e "${YELLOW}  ⚠ Arquivo não encontrado: $file${NC}"
    fi
done

echo ""
echo -e "${GREEN}✓ Arquivos copiados com sucesso!${NC}"

# ============================================================
# EXECUTAR DEPLOY NA VPS
# ============================================================
echo ""
echo -e "${BLUE}🚀 Executando deploy na VPS...${NC}"
echo ""

ssh $SSH_USER@$VPS_IP << ENDSSH
    set -e
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📍 Localização: \$(hostname)"
    echo "📂 Diretório: $VPS_PATH"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    cd $VPS_PATH
    
    # Dar permissão aos scripts
    echo "🔐 Dando permissão aos scripts..."
    chmod +x deploy-fix.sh compilar-assets.sh validate-config.sh diagnostico-erro.sh
    echo ""
    
    # Executar deploy
    echo "🚀 Executando deploy..."
    ./deploy-fix.sh
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Deploy concluído na VPS!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ENDSSH

# ============================================================
# VALIDAÇÃO
# ============================================================
echo ""
echo -e "${BLUE}🧪 Executando validação...${NC}"
echo ""

ssh $SSH_USER@$VPS_IP << ENDSSH
    cd $VPS_PATH
    ./validate-config.sh
ENDSSH

# ============================================================
# TESTES FINAIS
# ============================================================
echo ""
echo -e "${BLUE}🌐 Testando URLs públicas...${NC}"
echo ""

echo -n "  Backend Health: "
if curl -s -o /dev/null -w "%{http_code}" https://api.avaliasolar.com.br/health | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "  ActiveAdmin: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.avaliasolar.com.br/admin/login)
if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ]; then
    echo -e "${GREEN}✓ (Status: $STATUS)${NC}"
else
    echo -e "${RED}✗ (Status: $STATUS)${NC}"
fi

echo -n "  Frontend: "
if curl -s -o /dev/null -w "%{http_code}" https://avaliasolar.com.br | grep -q "200"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# ============================================================
# RESUMO FINAL
# ============================================================
echo ""
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ✨ DEPLOY CONCLUÍDO! ✨                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${GREEN}✅ Deploy executado com sucesso!${NC}"
echo ""
echo "🌐 URLs para testar:"
echo "  • Frontend: https://avaliasolar.com.br"
echo "  • Backend API: https://api.avaliasolar.com.br/health"
echo "  • ActiveAdmin: https://api.avaliasolar.com.br/admin/login"
echo ""
echo "📋 Comandos úteis:"
echo "  • Ver logs backend:  ssh $SSH_USER@$VPS_IP 'docker logs -f ab0-backend'"
echo "  • Ver logs frontend: ssh $SSH_USER@$VPS_IP 'docker logs -f ab0-frontend'"
echo "  • Diagnóstico:       ssh $SSH_USER@$VPS_IP 'cd $VPS_PATH && ./diagnostico-erro.sh'"
echo ""
echo "🔄 Para reconectar na VPS:"
echo "  ssh $SSH_USER@$VPS_IP"
echo ""
