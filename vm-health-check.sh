#!/bin/bash
# vm-health-check.sh - Diagnóstico completo da VM Avalia Solar

echo "╔══════════════════════════════════════════════════════╗"
echo "║        DIAGNÓSTICO COMPLETO DA VM - AVALIA SOLAR     ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. INFORMAÇÕES BÁSICAS
echo "🖥️  INFORMAÇÕES BÁSICAS"
echo "═══════════════════════════════════════════════════════"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Data/Hora: $(date)"
echo "Kernel: $(uname -r)"
echo ""

# 2. CPU
echo "⚡ CPU"
echo "═══════════════════════════════════════════════════════"
echo "Cores: $(nproc)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
lscpu | grep "Model name" || echo "N/A"
echo ""

# 3. MEMÓRIA
echo "🧠 MEMÓRIA RAM"
echo "═══════════════════════════════════════════════════════"
free -h
echo ""
echo "Top 5 processos por memória:"
ps aux --sort=-%mem | head -6
echo ""

# 4. DISCO
echo "💾 DISCO"
echo "═══════════════════════════════════════════════════════"
df -h | grep -E "Filesystem|/dev/"
echo ""
echo "Docker disk usage:"
docker system df 2>/dev/null || echo "Docker não disponível"
echo ""

# 5. DOCKER CONTAINERS
echo "🐳 CONTAINERS DOCKER"
echo "═══════════════════════════════════════════════════════"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker não disponível"
echo ""

# 6. RECURSOS DOS CONTAINERS
echo "📊 RECURSOS DOS CONTAINERS"
echo "═══════════════════════════════════════════════════════"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || echo "Docker não disponível"
echo ""

# 7. REDE
echo "🌐 REDE"
echo "═══════════════════════════════════════════════════════"
echo "Portas abertas:"
ss -tulpn 2>/dev/null | grep LISTEN | grep -E "80|443|3000|5432|6379" || echo "Nenhuma porta monitorada encontrada"
echo ""

# 8. LOGS RECENTES
echo "📝 LOGS RECENTES (Últimas 10 linhas de cada container)"
echo "═══════════════════════════════════════════════════════"

if docker ps -q --filter "name=avalia_frontend" > /dev/null 2>&1; then
    echo ""
    echo "--- Frontend ---"
    docker logs --tail 10 avalia_frontend_prod 2>&1 | tail -10
fi

if docker ps -q --filter "name=avalia_backend" > /dev/null 2>&1; then
    echo ""
    echo "--- Backend ---"
    docker logs --tail 10 avalia_backend_prod 2>&1 | tail -10
fi

echo ""

# 9. AVISOS
echo "⚠️  AVISOS E RECOMENDAÇÕES"
echo "═══════════════════════════════════════════════════════"

# Verificar espaço em disco
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "🚨 CRÍTICO: Disco com ${DISK_USAGE}% de uso!"
    echo "   Executar: docker system prune -af"
elif [ "$DISK_USAGE" -gt 70 ]; then
    echo "⚠️  ATENÇÃO: Disco com ${DISK_USAGE}% de uso"
else
    echo "✅ Disco OK (${DISK_USAGE}% de uso)"
fi

# Verificar memória disponível
MEM_AVAILABLE=$(free -m | awk 'NR==2{print $7}')
if [ "$MEM_AVAILABLE" -lt 100 ]; then
    echo "🚨 CRÍTICO: Apenas ${MEM_AVAILABLE}MB de RAM disponível!"
elif [ "$MEM_AVAILABLE" -lt 200 ]; then
    echo "⚠️  ATENÇÃO: Apenas ${MEM_AVAILABLE}MB de RAM disponível"
else
    echo "✅ Memória OK (${MEM_AVAILABLE}MB disponível)"
fi

# Verificar load average
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
LOAD_INT=$(echo "$LOAD" | awk '{print int($1+0.5)}')
CORES=$(nproc)
if [ "$LOAD_INT" -gt "$CORES" ]; then
    echo "⚠️  ATENÇÃO: Load average ($LOAD) maior que número de cores ($CORES)"
else
    echo "✅ Load average OK ($LOAD)"
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                 DIAGNÓSTICO CONCLUÍDO                ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "💡 Para monitoramento contínuo:"
echo "   - htop (visual melhorado)"
echo "   - docker stats (recursos em tempo real)"
echo "   - docker logs -f <container> (logs ao vivo)"
