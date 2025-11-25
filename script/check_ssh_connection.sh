#!/bin/bash

echo "🔍 Verificando conexão SSH com o servidor de produção..."

# Função para testar a conexão SSH
test_ssh_connection() {
    local host=$1
    local user=$2
    local timeout=5

    echo "📡 Testando conexão com $user@$host..."
    ssh -o ConnectTimeout=$timeout -o BatchMode=yes -o StrictHostKeyChecking=no "$user@$host" 'echo "✅ Conexão SSH estabelecida com sucesso!"'
    return $?
}

# Função para verificar portas necessárias
check_ports() {
    local host=$1
    local ports=(22 3000 3001 5432)

    echo "🔍 Verificando portas necessárias..."
    for port in "${ports[@]}"; do
        echo "📡 Testando porta $port..."
        nc -zv -w 5 "$host" "$port" 2>&1
    done
}