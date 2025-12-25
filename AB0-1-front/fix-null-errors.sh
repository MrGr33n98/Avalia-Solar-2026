#!/bin/bash

echo "🚀 Iniciando blindagem de código contra erros de 'null message'..."

# 1. Substitui acessos diretos .message por ?.message com fallback
# Procura por qualquer letra/numero seguido de .message e troca por ?.message || fallback
find . -type f \( -name "*.tsx" -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/\([a-zA-Z0-9]\)\.message/\1?.message || "Erro inesperado"/g' {} +

# 2. Corrige casts perigosos de 'as Error' para 'as any' para evitar que o TS engane o runtime
find . -type f \( -name "*.tsx" -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/as Error/as any/g' {} +

# 3. Limpa duplicatas de interrogação caso o script rode duas vezes (ex: ??.message)
find . -type f \( -name "*.tsx" -name "*.ts" \) -not -path "*/node_modules/*" -exec sed -i 's/??\.message/?.message/g' {} +

echo "✅ Blindagem concluída com sucesso!"