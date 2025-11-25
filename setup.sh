#!/bin/bash

#######################################
# AB0-1 Local Setup Script
# 
# Este script configura o ambiente de desenvolvimento local
# para o projeto AB0-1 (Backend Rails + Frontend Next.js)
#
# Requisitos:
# - Docker e Docker Compose instalados
# - Ruby 3.2.2 (para desenvolvimento local sem Docker)
# - Node.js 18+ (para desenvolvimento local sem Docker)
# - PostgreSQL 14 (para desenvolvimento local sem Docker)
# - Redis (para desenvolvimento local sem Docker)
#######################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

log_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

log_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  ${1}${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_header "Verificando Pré-requisitos"
    
    local missing_deps=()
    
    # Check Docker
    if command_exists docker; then
        log_success "Docker encontrado: $(docker --version)"
    else
        log_warning "Docker não encontrado"
        missing_deps+=("docker")
    fi
    
    # Check Docker Compose
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose encontrado"
    else
        log_warning "Docker Compose não encontrado"
        missing_deps+=("docker-compose")
    fi
    
    # Check Ruby (optional for local dev)
    if command_exists ruby; then
        local ruby_version=$(ruby -v | cut -d' ' -f2)
        log_success "Ruby encontrado: ${ruby_version}"
    else
        log_warning "Ruby não encontrado (opcional para desenvolvimento local)"
    fi
    
    # Check Node.js (optional for local dev)
    if command_exists node; then
        log_success "Node.js encontrado: $(node --version)"
    else
        log_warning "Node.js não encontrado (opcional para desenvolvimento local)"
    fi
    
    # Check PostgreSQL (optional for local dev)
    if command_exists psql; then
        log_success "PostgreSQL encontrado: $(psql --version)"
    else
        log_warning "PostgreSQL não encontrado (opcional para desenvolvimento local)"
    fi
    
    # Check Redis (optional for local dev)
    if command_exists redis-cli; then
        log_success "Redis encontrado: $(redis-cli --version)"
    else
        log_warning "Redis não encontrado (opcional para desenvolvimento local)"
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_warning "Dependências ausentes para uso com Docker: ${missing_deps[*]}"
        log_info "Você pode instalar o Docker em: https://docs.docker.com/get-docker/"
    fi
}

# Setup environment files
setup_environment_files() {
    print_header "Configurando Arquivos de Ambiente"
    
    # Root .env
    if [ ! -f .env ]; then
        log_info "Criando arquivo .env na raiz..."
        cp .env.example .env
        
        # Generate random secrets
        log_info "Gerando secrets aleatórios..."
        
        if command_exists openssl; then
            # Generate random passwords
            POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-32)
            RAILS_MASTER_KEY=$(openssl rand -hex 32)
            SECRET_KEY_BASE=$(openssl rand -hex 64)
            JWT_SECRET=$(openssl rand -hex 64)
            
            # Update .env file
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/your_secure_password_here/${POSTGRES_PASSWORD}/" .env
                sed -i '' "s/your_rails_master_key_here/${RAILS_MASTER_KEY}/" .env
                sed -i '' "s/your_secret_key_base_here/${SECRET_KEY_BASE}/" .env
                sed -i '' "s/your_jwt_secret_here/${JWT_SECRET}/" .env
            else
                # Linux
                sed -i "s/your_secure_password_here/${POSTGRES_PASSWORD}/" .env
                sed -i "s/your_rails_master_key_here/${RAILS_MASTER_KEY}/" .env
                sed -i "s/your_secret_key_base_here/${SECRET_KEY_BASE}/" .env
                sed -i "s/your_jwt_secret_here/${JWT_SECRET}/" .env
            fi
            
            log_success "Secrets gerados e arquivo .env criado"
        else
            log_warning "OpenSSL não encontrado. Por favor, atualize manualmente os secrets no arquivo .env"
        fi
    else
        log_success "Arquivo .env já existe"
    fi
    
    # Backend .env files
    if [ ! -f AB0-1-back/.env.development ]; then
        if [ -f AB0-1-back/.env.development.example ]; then
            log_info "Criando AB0-1-back/.env.development..."
            cp AB0-1-back/.env.development.example AB0-1-back/.env.development
            log_success "Arquivo .env.development criado no backend"
        fi
    else
        log_success "Backend .env.development já existe"
    fi
    
    # Frontend .env files
    if [ ! -f AB0-1-front/.env.local ]; then
        if [ -f AB0-1-front/.env.example ]; then
            log_info "Criando AB0-1-front/.env.local..."
            cp AB0-1-front/.env.example AB0-1-front/.env.local
            log_success "Arquivo .env.local criado no frontend"
        fi
    else
        log_success "Frontend .env.local já existe"
    fi
}

# Create Docker network
setup_docker_network() {
    print_header "Configurando Rede Docker"
    
    if docker network ls | grep -q "ab0-network"; then
        log_success "Rede ab0-network já existe"
    else
        log_info "Criando rede ab0-network..."
        docker network create ab0-network
        log_success "Rede ab0-network criada"
    fi
}

# Setup with Docker
setup_with_docker() {
    print_header "Configuração com Docker"
    
    log_info "Parando containers existentes..."
    docker-compose down 2>/dev/null || true
    
    log_info "Construindo imagens Docker (isso pode levar alguns minutos)..."
    docker-compose build
    
    log_info "Iniciando serviços..."
    docker-compose up -d db redis
    
    log_info "Aguardando serviços ficarem prontos..."
    sleep 10
    
    log_info "Executando migrações do banco de dados..."
    docker-compose run --rm backend rails db:create db:migrate
    
    log_info "Populando dados iniciais (seeds)..."
    docker-compose run --rm backend rails db:seed
    
    log_info "Iniciando backend e frontend..."
    docker-compose up -d backend frontend
    
    log_success "Configuração com Docker concluída!"
    
    echo ""
    log_info "Serviços disponíveis:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:3001"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis: localhost:6379"
    echo ""
    log_info "Para ver os logs: docker-compose logs -f"
    log_info "Para parar os serviços: docker-compose down"
}

# Setup local development (without Docker)
setup_local_dev() {
    print_header "Configuração Local (sem Docker)"
    
    # Backend setup
    log_info "Configurando Backend (Rails)..."
    cd AB0-1-back
    
    if [ ! -d "vendor/bundle" ] && [ ! -d ".bundle" ]; then
        log_info "Instalando gems do Ruby..."
        bundle install
    else
        log_success "Gems já instaladas"
    fi
    
    log_info "Criando banco de dados..."
    bundle exec rails db:create || log_warning "Banco de dados já existe ou erro ao criar"
    
    log_info "Executando migrações..."
    bundle exec rails db:migrate
    
    log_info "Populando dados iniciais..."
    bundle exec rails db:seed
    
    cd ..
    
    # Frontend setup
    log_info "Configurando Frontend (Next.js)..."
    cd AB0-1-front
    
    if [ ! -d "node_modules" ]; then
        log_info "Instalando dependências do Node.js..."
        npm install
    else
        log_success "Dependências do Node.js já instaladas"
    fi
    
    cd ..
    
    log_success "Configuração local concluída!"
    
    echo ""
    log_info "Para iniciar os serviços localmente:"
    echo ""
    echo "  Terminal 1 - PostgreSQL (se não estiver rodando):"
    echo "    postgres -D /usr/local/var/postgresql@14"
    echo ""
    echo "  Terminal 2 - Redis (se não estiver rodando):"
    echo "    redis-server"
    echo ""
    echo "  Terminal 3 - Backend:"
    echo "    cd AB0-1-back && bundle exec rails server -p 3001"
    echo ""
    echo "  Terminal 4 - Sidekiq (jobs em background):"
    echo "    cd AB0-1-back && bundle exec sidekiq"
    echo ""
    echo "  Terminal 5 - Frontend:"
    echo "    cd AB0-1-front && npm run dev"
    echo ""
}

# Main menu
show_menu() {
    print_header "AB0-1 Setup - Escolha uma opção"
    
    echo "1) Configuração completa com Docker (Recomendado)"
    echo "2) Configuração para desenvolvimento local (sem Docker)"
    echo "3) Apenas verificar pré-requisitos"
    echo "4) Apenas configurar arquivos de ambiente"
    echo "5) Recriar banco de dados (Docker)"
    echo "6) Ver logs dos serviços (Docker)"
    echo "7) Parar todos os serviços (Docker)"
    echo "8) Limpar tudo (Docker)"
    echo "9) Sair"
    echo ""
    read -p "Escolha uma opção [1-9]: " choice
    
    case $choice in
        1)
            check_prerequisites
            setup_environment_files
            setup_docker_network
            setup_with_docker
            ;;
        2)
            check_prerequisites
            setup_environment_files
            setup_local_dev
            ;;
        3)
            check_prerequisites
            ;;
        4)
            setup_environment_files
            ;;
        5)
            log_info "Recriando banco de dados..."
            docker-compose run --rm backend rails db:drop db:create db:migrate db:seed
            log_success "Banco de dados recriado!"
            ;;
        6)
            docker-compose logs -f
            ;;
        7)
            log_info "Parando serviços..."
            docker-compose down
            log_success "Serviços parados"
            ;;
        8)
            log_warning "Isso irá remover todos os containers, volumes e imagens relacionados"
            read -p "Tem certeza? (y/N): " confirm
            if [[ $confirm == [yY] ]]; then
                log_info "Limpando tudo..."
                docker-compose down -v --rmi all
                docker network rm ab0-network 2>/dev/null || true
                log_success "Limpeza concluída"
            else
                log_info "Operação cancelada"
            fi
            ;;
        9)
            log_info "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida"
            show_menu
            ;;
    esac
}

# Quick start function (non-interactive)
quick_start() {
    print_header "AB0-1 Quick Start com Docker"
    
    check_prerequisites
    setup_environment_files
    setup_docker_network
    setup_with_docker
}

# Main script
main() {
    clear
    
    echo -e "${GREEN}"
    cat << "EOF"
    ___    ____  ____        ____
   /   |  / __ )/ __ \      <  /
  / /| | / __  / / / /______/ / 
 / ___ |/ /_/ / /_/ /_____/ /  
/_/  |_/_____/\____/     /_/   
                                
   Setup & Development Tools
EOF
    echo -e "${NC}"
    
    # Check if running with --quick flag
    if [[ "$1" == "--quick" ]] || [[ "$1" == "-q" ]]; then
        quick_start
    else
        show_menu
    fi
}

# Run main function
main "$@"
