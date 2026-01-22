#!/bin/bash
# Script de Validação - Revogação JWT via Redis
# Executa todos os testes e validações necessárias

set -e  # Exit on error

echo "=========================================="
echo "🔐 Validação: Revogação JWT via Redis"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

# Function to print error
error() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "📋 Checklist de Pré-Deploy"
echo "----------------------------------------"
echo ""

# 1. Check Redis
echo "1️⃣ Verificando Redis..."
if redis-cli ping > /dev/null 2>&1; then
    success "Redis está rodando"
    REDIS_KEYS=$(redis-cli DBSIZE | grep -o '[0-9]*')
    echo "   Chaves atuais: $REDIS_KEYS"
else
    error "Redis não está acessível"
    echo "   Execute: docker-compose up redis -d"
fi
echo ""

# 2. Check Backend Dependencies
echo "2️⃣ Verificando dependências do Backend..."
cd AB0-1-back
if bundle check > /dev/null 2>&1; then
    success "Gems instaladas corretamente"
else
    warning "Algumas gems faltando, executando bundle install..."
    bundle install
fi

# Check if JWT gem is installed
if bundle list | grep -q "jwt"; then
    success "Gem JWT instalada"
else
    error "Gem JWT não encontrada"
fi

# Check if Redis gem is installed
if bundle list | grep -q "redis"; then
    success "Gem Redis instalada"
else
    error "Gem Redis não encontrada"
fi
echo ""

# 3. Check if new files exist
echo "3️⃣ Verificando arquivos criados..."
FILES=(
    "app/services/jwt_blacklist_service.rb"
    "app/controllers/concerns/jwt_authenticatable.rb"
    "spec/services/jwt_blacklist_service_spec.rb"
    "spec/requests/api/v1/auth_logout_spec.rb"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        success "Arquivo existe: $file"
    else
        error "Arquivo faltando: $file"
    fi
done
echo ""

# 4. Run Backend Tests
echo "4️⃣ Executando testes RSpec..."
if [ -f "spec/services/jwt_blacklist_service_spec.rb" ]; then
    echo "   Testando JwtBlacklistService..."
    if bundle exec rspec spec/services/jwt_blacklist_service_spec.rb --format documentation; then
        success "Testes do service passaram"
    else
        error "Testes do service falharam"
    fi
else
    warning "Arquivo de teste do service não encontrado"
fi

if [ -f "spec/requests/api/v1/auth_logout_spec.rb" ]; then
    echo "   Testando Auth Logout API..."
    if bundle exec rspec spec/requests/api/v1/auth_logout_spec.rb --format documentation; then
        success "Testes da API passaram"
    else
        error "Testes da API falharam"
    fi
else
    warning "Arquivo de teste da API não encontrado"
fi
echo ""

# 5. Check routes
echo "5️⃣ Verificando rotas..."
if bundle exec rails routes | grep -q "logout_all"; then
    success "Rota /logout_all configurada"
else
    error "Rota /logout_all não encontrada"
fi
echo ""

# 6. Test Redis connection from Rails
echo "6️⃣ Testando conexão Redis no Rails..."
cat > /tmp/test_redis.rb << 'EOF'
require_relative 'config/environment'
begin
  if defined?(REDIS) && REDIS.ping == 'PONG'
    puts "OK: Redis conectado via Rails"
    exit 0
  else
    puts "ERROR: Redis não conectado"
    exit 1
  end
rescue => e
  puts "ERROR: #{e.message}"
  exit 1
end
EOF

if bundle exec rails runner /tmp/test_redis.rb; then
    success "Rails conectado ao Redis"
else
    error "Rails não consegue conectar ao Redis"
fi
rm -f /tmp/test_redis.rb
echo ""

# Return to root
cd ..

# 7. Check Frontend files
echo "7️⃣ Verificando arquivos do Frontend..."
cd AB0-1-front

if [ -f "lib/api-client.ts" ]; then
    if grep -q "TOKEN_REVOKED\|SESSION_EXPIRED" lib/api-client.ts; then
        success "Interceptor de revogação implementado"
    else
        warning "Interceptor de revogação pode estar faltando"
    fi
else
    error "Arquivo api-client.ts não encontrado"
fi

if [ -f "tests/e2e/auth-logout.spec.ts" ]; then
    success "Testes E2E criados"
else
    warning "Testes E2E não encontrados"
fi
echo ""

# 8. Check Frontend dependencies
echo "8️⃣ Verificando dependências do Frontend..."
if [ -f "package.json" ]; then
    if npm list > /dev/null 2>&1; then
        success "Dependências do npm instaladas"
    else
        warning "Algumas dependências podem estar faltando"
    fi
else
    error "package.json não encontrado"
fi
echo ""

# Return to root
cd ..

# 9. Manual validation steps
echo "9️⃣ Validação Manual Recomendada:"
echo "----------------------------------------"
echo "Execute manualmente os seguintes comandos:"
echo ""
echo "# 1. Fazer login e obter token"
echo "curl -X POST http://localhost:3001/api/v1/auth/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}' \\"
echo "  -c cookies.txt -v"
echo ""
echo "# 2. Verificar token funciona"
echo "curl http://localhost:3001/api/v1/auth/me -b cookies.txt"
echo ""
echo "# 3. Fazer logout (revogar token)"
echo "curl -X POST http://localhost:3001/api/v1/auth/logout -b cookies.txt"
echo ""
echo "# 4. Tentar usar token revogado (DEVE FALHAR)"
echo "curl http://localhost:3001/api/v1/auth/me -b cookies.txt"
echo ""
echo "# 5. Verificar no Redis"
echo "redis-cli KEYS 'jwt:blacklist:*'"
echo ""

# Summary
echo ""
echo "=========================================="
echo "📊 Resumo da Validação"
echo "=========================================="
echo -e "Testes passaram: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Testes falharam: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os testes passaram!${NC}"
    echo ""
    echo "Próximos passos:"
    echo "1. Execute a validação manual acima"
    echo "2. Commit e push: git add . && git commit -m 'feat(sec): JWT revocation via Redis'"
    echo "3. Abra PR para review"
    exit 0
else
    echo -e "${RED}❌ Alguns testes falharam${NC}"
    echo ""
    echo "Por favor, corrija os erros antes de prosseguir"
    exit 1
fi
