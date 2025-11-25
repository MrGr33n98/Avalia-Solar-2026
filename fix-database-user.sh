#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Script para criar o usuário 'ab0' no PostgreSQL existente
# OPÇÃO A - Mantém os dados existentes
# ═══════════════════════════════════════════════════════════════════════════

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Criando usuário 'ab0' no PostgreSQL (OPÇÃO A)             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se o container está rodando
echo "🔍 Verificando se o container ab0-postgres está rodando..."
if ! docker ps | grep -q ab0-postgres; then
    echo "❌ Container ab0-postgres não está rodando!"
    echo "   Execute: docker-compose up -d db"
    exit 1
fi
echo "✅ Container está rodando"
echo ""

# Verificar se o usuário postgres existe (deve sempre existir)
echo "🔍 Verificando usuário postgres..."
if docker exec ab0-postgres psql -U postgres -c "\q" 2>/dev/null; then
    echo "✅ Usuário postgres encontrado"
else
    echo "❌ Não foi possível conectar como postgres"
    exit 1
fi
echo ""

# Verificar se o usuário 'ab0' já existe
echo "🔍 Verificando se usuário 'ab0' já existe..."
if docker exec ab0-postgres psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='ab0'" | grep -q 1; then
    echo "⚠️  Usuário 'ab0' já existe!"
    echo "   Atualizando senha e privilégios..."
    
    # Atualizar senha e privilégios
    docker exec ab0-postgres psql -U postgres -c "ALTER USER ab0 WITH PASSWORD 'ZAbgbZeVAK!5!' CREATEDB SUPERUSER;"
    echo "✅ Senha e privilégios atualizados"
else
    echo "📝 Criando usuário 'ab0'..."
    docker exec ab0-postgres psql -U postgres -c "CREATE USER ab0 WITH PASSWORD 'ZAbgbZeVAK!5!' CREATEDB SUPERUSER;"
    echo "✅ Usuário 'ab0' criado com sucesso!"
fi
echo ""

# Verificar se o banco 'ab0_production' já existe
echo "🔍 Verificando se banco 'ab0_production' já existe..."
if docker exec ab0-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='ab0_production'" | grep -q 1; then
    echo "⚠️  Banco 'ab0_production' já existe!"
    echo "   Atualizando owner..."
    
    # Atualizar owner
    docker exec ab0-postgres psql -U postgres -c "ALTER DATABASE ab0_production OWNER TO ab0;"
    echo "✅ Owner atualizado"
else
    echo "📝 Criando banco 'ab0_production'..."
    docker exec ab0-postgres psql -U postgres -c "CREATE DATABASE ab0_production OWNER ab0;"
    echo "✅ Banco 'ab0_production' criado com sucesso!"
fi
echo ""

# Garantir todos os privilégios
echo "🔐 Garantindo privilégios ao usuário 'ab0'..."
docker exec ab0-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ab0_production TO ab0;"
echo "✅ Privilégios concedidos"
echo ""

# Teste final de conexão
echo "🧪 Testando conexão como usuário 'ab0'..."
if docker exec ab0-postgres psql -U ab0 -d ab0_production -c "SELECT current_user, current_database(), version();" > /dev/null 2>&1; then
    echo "✅ Conexão testada com sucesso!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 Informações do banco:"
    docker exec ab0-postgres psql -U ab0 -d ab0_production -c "SELECT current_user as usuario, current_database() as banco;"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Erro ao testar conexão!"
    exit 1
fi
echo ""

# Listar usuários
echo "👥 Usuários no PostgreSQL:"
docker exec ab0-postgres psql -U postgres -c "\du"
echo ""

# Listar bancos
echo "🗄️  Bancos de dados:"
docker exec ab0-postgres psql -U postgres -c "\l" | grep -E "Name|ab0_production|postgres" | head -10
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ CONCLUÍDO COM SUCESSO!                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📝 PRÓXIMOS PASSOS:"
echo ""
echo "1. Configure os GitHub Secrets:"
echo "   https://github.com/MrGr33n98/AB0-1/settings/secrets/actions"
echo ""
echo "2. Adicione os seguintes secrets:"
echo "   - POSTGRES_USER: ab0"
echo "   - POSTGRES_PASSWORD: ZAbgbZeVAK!5!"
echo "   - POSTGRES_DB: ab0_production"
echo "   - RAILS_MASTER_KEY: 926316d3121bac4b8751ada0031657ec"
echo "   - SECRET_KEY_BASE: b9dc7d3fc96f0a55910270a2cd493dcaf8daf290faed2b820ccf8c1f56c2c62ffc8231ab3b6514f6a9388b662aab52c357c0889d0dab76fcc825cf3b3adfb5de"
echo "   - JWT_SECRET: 42546c6329b1906d0fdf48104f4a0cc90ec4b9e71969cfba395cdb618a551d0093c4f0c2cb2da9cfb8d41b478aa9547cf139cda8b626b272edc339af96325fcb"
echo ""
echo "3. Teste o deployment:"
echo "   git commit --allow-empty -m 'test: trigger workflow after database fix'"
echo "   git push origin main"
echo ""
echo "4. Acompanhe em: https://github.com/MrGr33n98/AB0-1/actions"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
