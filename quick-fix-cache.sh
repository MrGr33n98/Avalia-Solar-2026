#!/bin/bash
# quick-fix-cache.sh
# Script rápido para limpar cache do Next.js

echo "⚡ Quick Fix: Limpando cache Next.js"
echo "====================================="
echo ""

echo "🗑️ Removendo diretório .next do container..."
docker exec avalia_frontend_prod rm -rf /app/.next 2>/dev/null && echo "✅ Cache removido" || echo "⚠️ Erro ao remover cache"
echo ""

echo "🔄 Reiniciando container..."
docker restart avalia_frontend_prod
echo "✅ Container reiniciado"
echo ""

echo "⏳ Aguardando 10 segundos..."
sleep 10
echo ""

echo "📋 Verificando logs..."
echo "=========================================="
docker logs --tail 30 avalia_frontend_prod
echo "=========================================="
echo ""

echo "✅ Quick fix concluído!"
echo ""
echo "Se o erro persistir, execute: ./force-fix-nextjs.sh"
