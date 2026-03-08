# 🔍 DIAGNÓSTICO DE DEPLOY - 08/03/2026 21:16 UTC

## 📊 STATUS DOS CONTAINERS

```
SERVIÇO          STATUS           PORTA          OBSERVAÇÃO
─────────────────────────────────────────────────────────────
ab0-frontend     unhealthy ⚠️     3000          PROBLEMA!
ab0-backend      starting 🔄      3001          Recém reiniciado
ab0-worker       running ✅       -             OK
ab0-postgres     healthy ✅       5432          OK (9 dias uptime)
ab0-redis        healthy ✅       6379          OK (9 dias uptime)
npm-app          running ✅       80,81,443     Nginx Proxy Manager
n8n              healthy ✅       5678          Automação OK
listmonk         running ✅       9001          Email marketing OK
```

## 🚨 PROBLEMA PRINCIPAL

### **Frontend Container: UNHEALTHY**
```
Container ID: a606b51d697c
Image: c423cf703229 (hash - sem tag específica)
Status: Up 3 hours (unhealthy)
Port: 0.0.0.0:3000->3000/tcp
```

**Possíveis Causas:**
1. ❌ Health check falhando
2. ❌ Next.js não consegue buildar
3. ❌ Falta de memória (server tem apenas 2GB, 55% usado)
4. ❌ Dependências faltando (react-day-picker issue anterior)
5. ❌ Secrets não configurados corretamente

---

## 🔧 COMANDOS DE DIAGNÓSTICO

### 1️⃣ **Verificar logs do frontend**
```bash
ssh root@64.225.59.107
docker logs ab0-frontend --tail 100
```

### 2️⃣ **Verificar health check**
```bash
docker inspect ab0-frontend | grep -A 20 "Health"
```

### 3️⃣ **Verificar uso de recursos**
```bash
docker stats --no-stream ab0-frontend
```

### 4️⃣ **Testar se Next.js responde**
```bash
curl -I http://localhost:3000
curl http://localhost:3000/api/health
```

### 5️⃣ **Verificar se build completou**
```bash
docker exec ab0-frontend ls -la .next/
```

---

## 🩹 SOLUÇÕES IMEDIATAS

### **Solução A: Restart Forçado**
```bash
docker compose restart frontend
docker compose logs -f frontend
```

### **Solução B: Rebuild com Cache Limpo**
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### **Solução C: Aumentar Memória do Build**
```bash
# No Dockerfile.frontend, já temos:
NODE_OPTIONS='--max-old-space-size=6144'  # 6GB
# Mas o server só tem 2GB total! ❌

# Solução: Build localmente ou em CI/CD (já fazemos)
# Container roda apenas o build pronto
```

### **Solução D: Verificar Secrets**
```bash
docker exec ab0-frontend env | grep NEXT_
# Ver se todas variáveis estão presentes
```

---

## 🎯 PLANO DE AÇÃO IMEDIATO

### **PASSO 1: Coletar Logs**
```bash
ssh root@64.225.59.107
cd ~/Avalia-Solar-2026
docker logs ab0-frontend --tail 200 > frontend_error.log
cat frontend_error.log
```

### **PASSO 2: Verificar Health Check**
```bash
docker inspect ab0-frontend --format='{{json .State.Health}}' | jq
```

### **PASSO 3: Testar Conexão**
```bash
# De dentro do servidor
curl -v http://localhost:3000

# De fora (se proxy estiver configurado)
curl -v https://avaliasolar.com.br
```

### **PASSO 4: Restart Controlado**
```bash
# Parar frontend
docker compose stop frontend

# Limpar container antigo
docker compose rm -f frontend

# Pull nova imagem
docker compose pull frontend

# Subir novamente
docker compose up -d frontend

# Seguir logs
docker compose logs -f frontend
```

---

## 📋 CHECKLIST DE TROUBLESHOOTING

- [ ] Logs coletados e analisados
- [ ] Health check endpoint funcional
- [ ] Variáveis de ambiente corretas
- [ ] Build do Next.js completou com sucesso
- [ ] Porta 3000 acessível
- [ ] Nginx Proxy Manager configurado para redirecionar
- [ ] SSL certificado válido
- [ ] DNS apontando corretamente

---

## 🔍 ANÁLISE DO WORKFLOW

### **O que o deploy faz:**
```yaml
1. Build images no GitHub Actions ✅
2. Push para ghcr.io ✅
3. SSH no servidor ✅
4. Pull novas images ✅
5. Up backend primeiro ✅
6. Up frontend (FALHA AQUI?) ⚠️
```

### **Possível Gap:**
```bash
# No deploy script, linha 232:
echo "🚀 Subindo frontend..."
docker compose up -d frontend

# ⚠️ Não aguarda frontend ficar healthy!
# Backend aguarda 90 segundos, frontend não.
```

---

## 🛠️ FIX RECOMENDADO NO WORKFLOW

### **Adicionar após linha 265 (frontend up):**
```bash
echo "⏳ Aguardando frontend ficar healthy..."
FRONTEND_CID=$(docker compose ps -q frontend)
if [ -z "$FRONTEND_CID" ]; then
  echo "!! ERRO: container frontend não encontrado"
  exit 1
fi

for i in $(seq 1 60); do
  FRONTEND_STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$FRONTEND_CID" 2>/dev/null || echo "missing")
  
  if [ "$FRONTEND_STATUS" = "healthy" ] || [ "$FRONTEND_STATUS" = "running" ]; then
    echo "✅ Frontend OK"
    break
  fi
  
  if [ $i -eq 60 ]; then
    echo "⚠️ Frontend não ficou healthy em 60s"
    docker logs "$FRONTEND_CID" --tail 50
  fi
  
  sleep 1
done
```

---

## 🎯 PRÓXIMOS PASSOS

1. **AGORA:** Coletar logs do frontend
2. **IMEDIATO:** Restart controlado
3. **DEPOIS:** Atualizar workflow para monitorar frontend health
4. **LONGO PRAZO:** Considerar upgrade do servidor (2GB → 4GB)

---

## 📞 COMANDOS RÁPIDOS (Copy-Paste)

```bash
# Conectar
ssh root@64.225.59.107

# Ver logs frontend
docker logs ab0-frontend --tail 100

# Restart completo
docker compose restart frontend && docker compose logs -f frontend

# Se não funcionar, rebuild:
docker compose down frontend
docker compose up -d frontend --force-recreate

# Verificar status após 30s
sleep 30 && docker ps | grep frontend
```

---

**Status:** 🔴 CRÍTICO - Frontend unhealthy  
**Prioridade:** P0 - Resolver agora  
**ETA Fix:** 15 minutos
