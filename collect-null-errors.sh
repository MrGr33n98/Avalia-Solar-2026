#!/bin/bash

LOG_FILE="error_collection.log"
CONTAINER_NAME="avalia_frontend_prod"

echo "📊 Coletando Erros: TypeError (message) - Avalia Solar"
echo "====================================================="
echo "📅 Data: $(date)"
echo ""

echo "🔢 Contagem de ocorrências do erro 'reading message':"
docker logs $CONTAINER_NAME 2>&1 | grep -c "Cannot read properties of null (reading 'message')" || echo "0"
echo ""

echo "🔍 Últimas 5 ocorrências detalhadas:"
echo "-----------------------------------------------------"
docker logs $CONTAINER_NAME 2>&1 | grep -B 1 -A 5 "Cannot read properties of null (reading 'message')" | tail -n 30
echo ""

echo "🌐 Verificando requisições recentes que podem ter causado o erro:"
docker logs $CONTAINER_NAME 2>&1 | grep -E "GET|POST" | tail -n 10
echo ""

docker logs $CONTAINER_NAME 2>&1 | grep -B 2 "Cannot read properties of null (reading 'message')" > $LOG_FILE

echo "✅ Coleta concluída! Detalhes salvos em: $LOG_FILE"
echo "====================================================="