#!/bin/bash
# diagnose-nextjs-error.sh
# Script para diagnosticar o erro de digest e verificar arquivos

echo "🔍 Diagnóstico do Erro Next.js - Avalia Solar"
echo "=============================================="
echo ""

echo "📋 1. Verificando arquivos críticos no container..."
echo ""

echo "   ├─ app/categories/layout.tsx"
docker exec avalia_frontend_prod cat /app/app/categories/layout.tsx 2>/dev/null | head -10 || echo "   ⚠️ Arquivo não encontrado no container"
echo ""

echo "   ├─ app/categories/[slug]/layout.tsx"
docker exec avalia_frontend_prod cat /app/app/categories/[slug]/layout.tsx 2>/dev/null | head -10 || echo "   ⚠️ Arquivo não encontrado no container"
echo ""

echo "📋 2. Verificando se 'use client' ainda existe nos layouts..."
echo ""
USE_CLIENT_CATEGORIES=$(docker exec avalia_frontend_prod grep -n "use client" /app/app/categories/layout.tsx 2>/dev/null || echo "Não encontrado")
USE_CLIENT_SLUG=$(docker exec avalia_frontend_prod grep -n "use client" /app/app/categories/[slug]/layout.tsx 2>/dev/null || echo "Não encontrado")

if [ "$USE_CLIENT_CATEGORIES" != "Não encontrado" ]; then
    echo "   ❌ PROBLEMA: 'use client' ainda existe em categories/layout.tsx"
    echo "   $USE_CLIENT_CATEGORIES"
else
    echo "   ✅ OK: Nenhum 'use client' em categories/layout.tsx"
fi

if [ "$USE_CLIENT_SLUG" != "Não encontrado" ]; then
    echo "   ❌ PROBLEMA: 'use client' ainda existe em [slug]/layout.tsx"
    echo "   $USE_CLIENT_SLUG"
else
    echo "   ✅ OK: Nenhum 'use client' em [slug]/layout.tsx"
fi
echo ""

echo "📋 3. Verificando diretório .next (cache)..."
docker exec avalia_frontend_prod ls -la /app/.next 2>/dev/null | head -5 || echo "   ⚠️ Diretório .next não existe"
echo ""

echo "📋 4. Verificando últimos logs do container..."
echo "=============================================="
docker logs --tail 20 avalia_frontend_prod
echo "=============================================="
echo ""

echo "📋 5. Status do container..."
docker ps -a | grep avalia_frontend_prod
echo ""

echo "🔧 DIAGNÓSTICO CONCLUÍDO"
echo ""
echo "❓ Se ainda houver 'use client' nos layouts:"
echo "   1. Os arquivos no HOST não foram copiados para o container"
echo "   2. Execute: docker-compose down && docker-compose build --no-cache frontend && docker-compose up -d"
echo ""
echo "❓ Se não houver 'use client' mas erro persiste:"
echo "   1. Limpe o cache: docker exec avalia_frontend_prod rm -rf /app/.next"
echo "   2. Restart: docker restart avalia_frontend_prod"
echo ""
