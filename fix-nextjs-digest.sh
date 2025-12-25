#!/bin/bash
# fix-nextjs-digest.sh
# Script para corrigir erro: Cannot read properties of null (reading 'digest')

set -e

echo "🔧 Fix Next.js Digest Error - Avalia Solar"
echo "=========================================="
echo ""

echo "🛑 Step 1: Parando containers..."
docker-compose down
echo "✅ Containers parados"
echo ""

echo "🗑️ Step 2: Limpando cache Docker..."
docker system prune -f
echo "✅ Cache limpo"
echo ""

echo "🗑️ Step 3: Removendo imagens antigas do frontend..."
docker rmi avalia-solar-2026-frontend 2>/dev/null || echo "   (Imagem já removida ou não existe)"
docker rmi $(docker images -q avalia-solar-2026-frontend) 2>/dev/null || echo "   (Nenhuma imagem adicional encontrada)"
echo "✅ Imagens antigas removidas"
echo ""

echo "🔨 Step 4: Rebuild SEM cache (pode demorar 2-5 minutos)..."
docker-compose build --no-cache --pull frontend
echo "✅ Build concluído"
echo ""

echo "🚀 Step 5: Subindo containers..."
docker-compose up -d
echo "✅ Containers iniciados"
echo ""

echo "⏳ Step 6: Aguardando inicialização (10 segundos)..."
sleep 10
echo ""

echo "📋 Step 7: Verificando logs do frontend..."
echo "=========================================="
docker logs --tail 50 avalia_frontend_prod
echo "=========================================="
echo ""

echo "✅ Processo concluído!"
echo ""
echo "🔍 Continue monitorando os logs com:"
echo "   docker logs -f avalia_frontend_prod"
echo ""
echo "📖 Para mais informações, consulte: FIX_DIGEST_ERROR_NEXTJS.md"
