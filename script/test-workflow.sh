#!/bin/bash

# Verifica se está em um repositório git
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "❌ Erro: Este diretório não é um repositório git"
    exit 1
fi

# Verifica se há alterações para commit
if [ -z "$(git status --porcelain)" ]; then
    echo "⚠️ Não há alterações para commit"
    exit 0
fi

# Adiciona todas as alterações
echo "📦 Adicionando alterações..."
git add .

# Cria um commit com timestamp
echo "✍️ Criando commit..."
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "test: workflow deploy - $TIMESTAMP"

# Faz push para a branch main
echo "🚀 Fazendo push para main..."
git push origin main

echo "✅ Processo concluído! Verifique o workflow de deploy no GitHub Actions."