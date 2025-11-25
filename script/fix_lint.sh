#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Erro: $1 não está instalado.${NC}"
        exit 1
    fi
}

# Verificar dependências
echo -e "${YELLOW}Verificando dependências...${NC}"
check_command npm
check_command bundle

# Criar diretório de backup
BACKUP_DIR="./script/rubocop_backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Função para fazer backup de arquivos
backup_files() {
    local dir=$1
    local pattern=$2
    find "$dir" -type f -name "$pattern" -exec cp --parents {} "$BACKUP_DIR/" \;
}

echo -e "${YELLOW}Fazendo backup dos arquivos...${NC}"

# Backup dos arquivos do frontend
if [ -d "AB0-1-front" ]; then
    backup_files "AB0-1-front" "*.ts"
    backup_files "AB0-1-front" "*.tsx"
    backup_files "AB0-1-front" "*.js"
    backup_files "AB0-1-front" "*.jsx"
    
    echo -e "${YELLOW}Corrigindo problemas de lint no frontend...${NC}"
    cd AB0-1-front
    npm install --silent
    npx eslint --fix "**/*.{ts,tsx,js,jsx}" || {
        echo -e "${RED}Erro ao corrigir lint no frontend${NC}"
        exit 1
    }
    cd ..
fi

# Backup dos arquivos do backend
if [ -d "AB0-1-back" ]; then
    backup_files "AB0-1-back" "*.rb"
    
    echo -e "${YELLOW}Corrigindo problemas de lint no backend...${NC}"
    cd AB0-1-back
    bundle install --quiet
    bundle exec rubocop -a || {
        echo -e "${RED}Erro ao corrigir lint no backend${NC}"
        exit 1
    }
    cd ..
fi

# Gerar relatório das mudanças
echo -e "${YELLOW}Gerando relatório das mudanças...${NC}"
REPORT_FILE="lint_fixes_report_$(date +%Y%m%d_%H%M%S).txt"

echo "Relatório de Correções de Lint - $(date)" > "$REPORT_FILE"
echo "----------------------------------------" >> "$REPORT_FILE"

echo "\nMudanças no Frontend:" >> "$REPORT_FILE"
if [ -d "AB0-1-front" ]; then
    cd AB0-1-front
    git diff --name-only >> "../$REPORT_FILE"
    cd ..
fi

echo "\nMudanças no Backend:" >> "$REPORT_FILE"
if [ -d "AB0-1-back" ]; then
    cd AB0-1-back
    git diff --name-only >> "../$REPORT_FILE"
    cd ..
fi

echo -e "${GREEN}Correções de lint concluídas!${NC}"
echo -e "${GREEN}Relatório gerado: $REPORT_FILE${NC}"
echo -e "${GREEN}Backup dos arquivos originais: $BACKUP_DIR${NC}"