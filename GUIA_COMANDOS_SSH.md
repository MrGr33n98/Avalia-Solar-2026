# 🔍 COMANDOS ESSENCIAIS SSH - Avalia Solar VM

## ⚡ COMANDOS RÁPIDOS DE DIAGNÓSTICO

### Status Geral (1 linha)
```bash
uptime && free -h && df -h && docker ps
```

### Diagnóstico Completo (Script Automatizado)
```bash
# Baixar e executar script de diagnóstico
cd ~/Avalia-Solar-2026
chmod +x vm-health-check.sh
./vm-health-check.sh
```

---

## 📊 ANÁLISE POR CATEGORIA

### 💾 DISCO
```bash
# Uso de disco
df -h

# Diretórios que mais ocupam
du -sh /* | sort -h

# Docker disk usage
docker system df

# Ver o que está ocupando no Docker
docker system df -v
```

### 🧠 MEMÓRIA
```bash
# Memória disponível
free -h

# Top 10 processos por memória
ps aux --sort=-%mem | head -10

# Memória dos containers
docker stats --no-stream
```

### ⚡ CPU
```bash
# Load average
uptime

# Monitoramento visual
htop  # Se não tiver: apt install htop

# Top processos por CPU
ps aux --sort=-%cpu | head -10

# CPU dos containers
docker stats
```

### 🐳 DOCKER

#### Containers
```bash
# Lista de containers
docker ps -a

# Status resumido
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Recursos em tempo real
docker stats

# Logs específicos
docker logs avalia_frontend_prod --tail 100
docker logs avalia_backend_prod --tail 100
docker logs avalia_redis_prod --tail 50
docker logs avalia_postgres_prod --tail 50

# Logs em tempo real
docker logs -f avalia_frontend_prod
```

#### Saúde dos Containers
```bash
# Ver estado de um container
docker inspect avalia_frontend_prod | grep -A 10 "State"

# Verificar se está "healthy"
docker ps --format "table {{.Names}}\t{{.Status}}"

# Restart de container específico
docker restart avalia_frontend_prod
```

#### Imagens
```bash
# Lista de imagens
docker images

# Espaço usado
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Imagens sem tag (lixo)
docker images -f "dangling=true"
```

### 🌐 REDE
```bash
# Portas abertas
ss -tulpn | grep LISTEN

# Testar conectividade
curl -I http://localhost
curl -I https://avaliasolar.com.br

# Ver portas dos containers
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Inspecionar rede Docker
docker network inspect avalia-solar-2026_default
```

### 📝 LOGS
```bash
# Logs do sistema
tail -f /var/log/syslog

# Logs do Docker daemon
journalctl -u docker -f

# Todos os logs dos containers
docker-compose logs -f

# Logs de container específico (últimas 100 linhas)
docker logs --tail 100 avalia_frontend_prod
```

---

## 🧹 LIMPEZA E MANUTENÇÃO

### Limpar Docker (Liberar Espaço)
```bash
# Limpar tudo (CUIDADO!)
docker system prune -af --volumes

# Limpar apenas o necessário
docker container prune -f    # Containers parados
docker image prune -af       # Imagens não usadas
docker volume prune -f       # Volumes não usados
docker network prune -f      # Redes não usadas
```

### Limpar Sistema
```bash
# Limpar apt
apt-get clean
apt-get autoremove -y

# Limpar logs antigos (> 7 dias)
journalctl --vacuum-time=7d

# Encontrar arquivos grandes
find / -type f -size +100M 2>/dev/null | head -20
```

---

## 🚀 RESTART E DEPLOY

### Restart de Containers
```bash
# Restart de um container
docker restart avalia_frontend_prod

# Restart de todos
docker-compose restart

# Down e Up (force recreate)
docker-compose down
docker-compose up -d --force-recreate
```

### Rebuild
```bash
# Rebuild frontend sem cache
docker-compose build --no-cache frontend
docker-compose up -d --force-recreate frontend

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Atualizar do Git e Deployar
```bash
cd ~/Avalia-Solar-2026
git pull origin main
docker-compose build --no-cache
docker-compose up -d --force-recreate
```

---

## 🔧 TROUBLESHOOTING

### Container não inicia
```bash
# Ver logs de erro
docker logs avalia_frontend_prod

# Ver estado
docker inspect avalia_frontend_prod | grep "Error"

# Ver eventos recentes
docker events --since 30m
```

### Sistema lento
```bash
# Ver o que consome CPU
top -o %CPU

# Ver o que consome RAM
top -o %MEM

# Monitorar I/O
iotop  # apt install iotop
```

### Sem espaço em disco
```bash
# Ver uso de disco
df -h

# Ver o que ocupa mais espaço
du -sh /* | sort -h | tail -10

# Limpar Docker
docker system prune -af --volumes

# Ver espaço do Docker
docker system df
```

### Erro de rede/conectividade
```bash
# Testar conexão externa
ping -c 3 google.com
curl -I https://google.com

# Ver portas abertas
ss -tulpn | grep LISTEN

# Reiniciar rede Docker
docker network prune -f
docker-compose down
docker-compose up -d
```

---

## 📊 MONITORAMENTO CONTÍNUO

### Htop (Melhor que top)
```bash
apt install htop -y
htop
```
**Teclas:**
- `F6` = Ordenar
- `F9` = Matar processo
- `q` = Sair

### Docker Stats em Tempo Real
```bash
# Atualização contínua
docker stats

# Formato customizado
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Glances (Completo)
```bash
apt install glances -y
glances
```

---

## 🎯 CHECKLIST DIÁRIO

Execute este comando completo:
```bash
echo "=== STATUS GERAL ===" && \
uptime && echo "" && \
free -h && echo "" && \
df -h && echo "" && \
echo "=== DOCKER ===" && \
docker ps && echo "" && \
docker stats --no-stream && echo "" && \
echo "=== LOGS RECENTES ===" && \
docker logs --tail 10 avalia_frontend_prod
```

Ou use o script:
```bash
./vm-health-check.sh
```

---

## 🚨 ALERTAS CRÍTICOS

### 🔴 Agir IMEDIATAMENTE se:
- Disco > 90% cheio
- RAM disponível < 100MB
- Load > 2.0 (para 1 vCPU)
- Containers reiniciando constantemente

### 🟡 Monitorar se:
- Disco > 70% cheio
- RAM disponível < 300MB
- Load > 1.5
- Resposta lenta

### 🟢 Tudo OK se:
- Disco < 70%
- RAM disponível > 300MB
- Load < 1.0
- Todos os containers "Up"

---

## 📞 COMANDOS DE EMERGÊNCIA

### Sistema travado
```bash
# Ver processos problemáticos
top -o %CPU

# Matar processo (cuidado!)
kill -9 <PID>

# Limpar cache
sync; echo 3 > /proc/sys/vm/drop_caches
```

### Container travado
```bash
# Force stop
docker stop -t 0 avalia_frontend_prod

# Remover e recriar
docker rm -f avalia_frontend_prod
docker-compose up -d frontend
```

### Tudo deu errado
```bash
# Reset total (ÚLTIMO RECURSO!)
cd ~/Avalia-Solar-2026
docker-compose down -v
docker system prune -af --volumes
docker-compose build --no-cache
docker-compose up -d
```

---

**📖 Consulte sempre que precisar!**

Para executar diagnóstico completo:
```bash
./vm-health-check.sh
```

Para monitoramento ao vivo:
```bash
htop
# ou
docker stats
# ou
glances
```
