# 🚀 Deploy GA4 em Produção (Docker)

## ✅ Configuração Aplicada

### 1. Backend
**Arquivo:** `AB0-1-back/.env`
```bash
GA4_MEASUREMENT_ID=G-9SD4S6S434
GA4_API_SECRET=ZTJIgY7fS9aZn3kZ1Ksfvw
GA4_ENABLE_ANALYTICS=true
```
✅ Já configurado (lê via `env_file: .env`)

### 2. Frontend
**Arquivo:** `docker-compose.yml`
```yaml
environment:
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-9SD4S6S434"
  NEXT_PUBLIC_GTM_ID: "GTM-5RV76ZKR"
  NEXT_PUBLIC_ENABLE_ANALYTICS: "true"
```
✅ Adicionado ao docker-compose

---

## 📦 Deploy Steps

### Na sua VM (SSH):

```bash
# 1. Pull código atualizado
cd /path/to/AB0-1-main
git pull origin main

# 2. Pull novas imagens Docker
docker-compose pull

# 3. Restart containers
docker-compose down
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f frontend | grep GA4
docker-compose logs -f backend | grep GA4
```

---

## 🧪 Testes de Validação

### 1. Backend (SSH na VM):
```bash
docker-compose exec backend rails runner "Ga4Service.track('production_test', { company_id: 1, timestamp: Time.now.to_i })"
```

### 2. Frontend (Browser):
Acesse: https://avaliasolar.com.br

DevTools Console (F12):
```javascript
// Verificar se gtag está carregado
typeof gtag
// Deve retornar: "function"

// Enviar evento teste
gtag('event', 'production_test', { 
  source: 'browser_console',
  test: true 
})
```

### 3. Verificar GA4:
- https://analytics.google.com/
- **Configure → DebugView**
- Deve aparecer eventos `production_test` em 5-10s

---

## 🔍 Troubleshooting

### Frontend não carrega gtag:
```bash
# Verificar variáveis no container
docker-compose exec frontend sh -c 'printenv | grep GA4'
# Deve mostrar: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-9SD4S6S434

# Se não aparecer, rebuild:
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Backend não envia eventos:
```bash
# Verificar variáveis
docker-compose exec backend rails runner "puts ENV['GA4_MEASUREMENT_ID']"
# Deve retornar: G-9SD4S6S434

# Verificar logs
docker-compose logs backend | grep -i ga4
```

---

## 📋 Checklist Final

- [x] `docker-compose.yml` atualizado com variáveis GA4
- [x] Backend `.env` tem credenciais GA4
- [ ] Git pull na VM
- [ ] Docker images atualizadas (`docker-compose pull`)
- [ ] Containers reiniciados (`docker-compose up -d`)
- [ ] Teste backend enviou evento
- [ ] Teste frontend enviou evento
- [ ] Eventos aparecem no GA4 DebugView
- [ ] Eventos aparecem no GA4 Realtime (30min depois)

---

## ⚡ Quick Deploy

**One-liner completo:**
```bash
cd /path/to/AB0-1-main && \
git pull && \
docker-compose pull && \
docker-compose down && \
docker-compose up -d && \
docker-compose logs -f
```

---

**Status:** ✅ Pronto para deploy
**Próximo:** Executar deploy na VM e testar
