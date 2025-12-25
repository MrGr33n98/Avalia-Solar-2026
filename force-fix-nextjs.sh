#!/bin/bash
# force-fix-nextjs.sh
# Script para forçar a correção completa do erro de digest

set -e

echo "🔧 FORÇA TOTAL: Fix Next.js Digest Error"
echo "========================================"
echo ""
echo "⚠️  Este script irá:"
echo "   1. Parar todos os containers"
echo "   2. Remover volumes e cache"
echo "   3. Fazer rebuild completo SEM cache"
echo "   4. Subir containers novamente"
echo ""
read -p "Continuar? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado pelo usuário"
    exit 1
fi
echo ""

echo "🛑 Step 1: Parando TODOS os containers..."
docker-compose down -v
echo "✅ Containers parados e volumes removidos"
echo ""

echo "🗑️ Step 2: Limpeza profunda do Docker..."
docker system prune -af --volumes
echo "✅ Cache Docker completamente limpo"
echo ""

echo "🗑️ Step 3: Removendo TODAS as imagens do projeto..."
docker images | grep avalia-solar-2026 | awk '{print $3}' | xargs -r docker rmi -f || echo "   (Nenhuma imagem encontrada)"
echo "✅ Imagens antigas removidas"
echo ""

echo "📝 Step 4: Verificando arquivos fonte no HOST..."
if grep -q "use client" AB0-1-front/app/categories/layout.tsx 2>/dev/null; then
    echo "   ❌ ERRO: 'use client' ainda existe em categories/layout.tsx"
    echo "   Por favor, corrija o arquivo manualmente antes de continuar!"
    exit 1
fi

if grep -q "use client" AB0-1-front/app/categories/[slug]/layout.tsx 2>/dev/null; then
    echo "   ❌ ERRO: 'use client' ainda existe em [slug]/layout.tsx"
    echo "   Por favor, corrija o arquivo manualmente antes de continuar!"
    exit 1
fi

echo "✅ Arquivos fonte OK"
echo ""

echo "🔨 Step 5: Rebuild COMPLETO sem cache (isso pode demorar 5-10 minutos)..."
docker-compose build --no-cache --pull
echo "✅ Build completo concluído"
echo ""

echo "🚀 Step 6: Subindo containers..."
docker-compose up -d
echo "✅ Containers iniciados"
echo ""

echo "⏳ Step 7: Aguardando inicialização (15 segundos)..."
sleep 15
echo ""

echo "📋 Step 8: Verificando logs..."
echo "=========================================="
docker logs --tail 50 avalia_frontend_prod
echo "=========================================="
echo ""

echo "✅ Processo de correção forçada concluído!"
echo ""
echo "🔍 Monitorar logs em tempo real:"
echo "   docker logs -f avalia_frontend_prod"
echo ""
echo "🧪 Testar endpoints:"
echo "   curl -I http://localhost/categories"
echo "   curl -I http://localhost/companies"
echo ""
