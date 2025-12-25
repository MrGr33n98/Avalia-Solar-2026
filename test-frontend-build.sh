#!/bin/bash

# 🔧 Script de teste local do frontend
# Testa build antes de fazer deploy

echo "🚀 Testando build do frontend..."
echo ""

cd AB0-1-front

echo "📦 1. Limpando cache..."
rm -rf .next
rm -rf node_modules/.cache

echo ""
echo "🔍 2. Verificando TypeScript..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Erros de TypeScript encontrados!"
  echo "Corrija os erros antes de continuar."
  exit 1
fi

echo ""
echo "✅ TypeScript OK!"
echo ""
echo "🏗️ 3. Fazendo build de produção..."
npm run build

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Build falhou!"
  echo "Verifique os erros acima."
  exit 1
fi

echo ""
echo "✅ Build completo com sucesso!"
echo ""
echo "📊 Estatísticas:"
du -sh .next
echo ""

echo "🎉 Pronto para deploy!"
echo ""
echo "Próximos passos:"
echo "1. docker-compose build frontend"
echo "2. docker-compose up -d"
echo "3. docker logs avalia_frontend_prod --tail 50"
