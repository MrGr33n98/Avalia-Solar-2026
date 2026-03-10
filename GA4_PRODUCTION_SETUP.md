# 🚀 Configuração GA4 para Produção

## ✅ Status Atual

### Backend (já configurado no .env)
```bash
GA4_MEASUREMENT_ID=G-9SD4S6S434
GA4_API_SECRET=ZTJIgY7fS9aZn3kZ1Ksfvw
GA4_ENABLE_ANALYTICS=true
```

### Frontend (precisa configurar na plataforma de deploy)
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-9SD4S6S434
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

## 🔧 Como Configurar em Produção

### **Opção 1: Docker Compose (VM/VPS)**

O backend já está OK (lê do `.env` via `env_file: .env`).

Para o frontend, adicione no `docker-compose.yml`:

```yaml
frontend:
  image: ghcr.io/mrgr33n98/avalia-solar-2026-frontend:latest
  environment:
    NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-9SD4S6S434"
    NEXT_PUBLIC_ENABLE_ANALYTICS: "true"
    NEXT_PUBLIC_GTM_ID: "GTM-5RV76ZKR"
```

**OU** crie `AB0-1-front/.env.production`:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-9SD4S6S434
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

E adicione no `docker-compose.yml`:
```yaml
frontend:
  env_file: 
    - .env
    - AB0-1-front/.env.production
```

---

### **Opção 2: Vercel/Netlify (Frontend)**

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Adicionar:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID = G-9SD4S6S434
   NEXT_PUBLIC_ENABLE_ANALYTICS = true
   ```
3. Redeploy

**Netlify:**
1. Site Settings → Environment Variables
2. Adicionar as mesmas variáveis
3. Trigger redeploy

---

### **Opção 3: Railway/Render (Backend)**

Já está configurado no `.env` que é commitado. Apenas certifique-se:
- Arquivo `.env` está na raiz do backend
- Platform lê o `.env` automaticamente

**OU** configure nas Environment Variables da plataforma:
```
GA4_MEASUREMENT_ID=G-9SD4S6S434
GA4_API_SECRET=ZTJIgY7fS9aZn3kZ1Ksfvw
```

---

### **Opção 4: GitHub Secrets (CI/CD)**

Se usar GitHub Actions, adicione secrets:

```yaml
# .github/workflows/deploy.yml
env:
  NEXT_PUBLIC_GA_MEASUREMENT_ID: ${{ secrets.GA4_MEASUREMENT_ID }}
  GA4_API_SECRET: ${{ secrets.GA4_API_SECRET }}
```

---

## 🧪 Teste de Produção

### 1. Backend (SSH na VM):
```bash
cd /path/to/AB0-1-main/AB0-1-back
docker-compose exec backend rails runner "Ga4Service.track('production_test', { company_id: 1 })"
```

### 2. Frontend (Browser):
```javascript
// Abra DevTools (F12) no site de produção
gtag('event', 'production_test', { 
  test: true,
  source: 'browser_console' 
})
```

### 3. Verificar no GA4:
- https://analytics.google.com/
- **Configure → DebugView** (eventos em tempo real)
- **Reports → Realtime** (últimos 30 minutos)

---

## 📋 Checklist de Deploy

### Backend:
- [x] `GA4_MEASUREMENT_ID` configurado no `.env`
- [x] `GA4_API_SECRET` configurado no `.env`
- [ ] `.env` está na VM/container
- [ ] Reiniciar containers: `docker-compose restart backend`

### Frontend:
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` configurado
- [ ] `NEXT_PUBLIC_ENABLE_ANALYTICS=true`
- [ ] Rebuild/redeploy do frontend
- [ ] Limpar cache do CDN (se tiver)

---

## 🔍 Validação Rápida

**Verificar se variáveis estão disponíveis em produção:**

### Backend (SSH):
```bash
docker-compose exec backend rails runner "puts ENV['GA4_MEASUREMENT_ID']"
# Deve retornar: G-9SD4S6S434
```

### Frontend (Browser DevTools):
```javascript
console.log(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
// Deve retornar: G-9SD4S6S434
```

---

## ⚠️ Notas Importantes

1. **Variáveis `NEXT_PUBLIC_*` precisam ser definidas em BUILD TIME**
   - Next.js injeta essas variáveis durante o build
   - Se adicionar depois do build, precisa rebuild

2. **Não commitar `.env.local`**
   - Use apenas para desenvolvimento local
   - Em produção, use `.env.production` ou variáveis da plataforma

3. **Backend lê variáveis em RUNTIME**
   - Não precisa rebuild
   - Apenas reiniciar o servidor

---

## 🎯 Onde Você Está Hospedado?

Responda para eu dar instruções específicas:

1. **VM própria (Ubuntu/Debian)?** → Usar docker-compose.yml
2. **Vercel (frontend)?** → Environment Variables no dashboard
3. **Railway/Render?** → Environment Variables na plataforma
4. **Outro?** → Me diga qual

---

**Status:** ✅ Testes locais OK, aguardando configuração em produção
