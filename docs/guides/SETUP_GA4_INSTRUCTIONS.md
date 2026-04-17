# 🚀 Instruções de Configuração GA4

## ✅ O que foi implementado:

1. ✅ Script GA4 adicionado ao `app/layout.tsx` (frontend)
2. ✅ Variáveis de ambiente adicionadas nos `.env.example` (frontend)
3. ✅ Variáveis de ambiente adicionadas no `.env` (backend)
4. ✅ Componente `GoogleAnalytics` criado para injeção do gtag.js
5. ✅ Integração já existe no backend via `Ga4Service`

---

## 🔑 O QUE VOCÊ PRECISA FAZER AGORA:

### **Passo 1: Obter Credenciais do GA4**

#### 1.1 - Measurement ID (G-XXXXXXXXXX)
1. Acesse: https://analytics.google.com/
2. Clique em **Admin** (ícone de engrenagem no canto inferior esquerdo)
3. Na coluna **Property**, clique em **Data Streams**
4. Selecione seu stream (ou crie um novo para web)
5. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

#### 1.2 - API Secret (Para Backend)
1. Na mesma página do stream (passo acima)
2. Role até **Measurement Protocol API secrets**
3. Clique em **Create**
4. Dê um nome (ex: "Backend Rails API")
5. Copie o **Secret Value** gerado

---

### **Passo 2: Configurar Frontend**

Edite o arquivo: `AB0-1-front/.env.local` (crie se não existir):

```bash
# Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # ← Cole seu Measurement ID aqui
NEXT_PUBLIC_ENABLE_ANALYTICS=true           # ← Ative o analytics
```

**⚠️ IMPORTANTE:** Não commite este arquivo! Ele já está no `.gitignore`.

---

### **Passo 3: Configurar Backend**

Edite o arquivo: `AB0-1-back/.env`

Adicione ou edite as linhas que foram adicionadas ao final do arquivo:

```bash
# Google Analytics 4 Configuration
GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # ← Cole seu Measurement ID aqui (mesmo do frontend)
GA4_API_SECRET=seu_api_secret    # ← Cole seu API Secret aqui
```

---

### **Passo 4: Reiniciar Servidores**

#### Frontend:
```bash
cd AB0-1-front
npm run dev
```

#### Backend:
```bash
cd AB0-1-back
rails s
```

---

### **Passo 5: Validar Funcionamento**

#### Teste Frontend (Browser):

1. Abra o site: http://localhost:3000
2. Pressione **F12** (DevTools)
3. No console, execute:
```javascript
gtag('event', 'test_frontend', { 
  company_id: '123',
  test_type: 'manual',
  debug_mode: true 
})
```

4. Acesse o **GA4 DebugView**:
   - https://analytics.google.com/
   - Configure → DebugView
   - Você deve ver o evento `test_frontend` aparecer em tempo real

#### Teste Backend (Rails):

```bash
cd AB0-1-back
rails runner "Ga4Service.track('test_backend', { company_id: 999, source: 'rails_console' })"
```

Verifique os logs:
```bash
tail -f log/development.log | grep GA4
```

Se tudo estiver correto, você verá:
```
[Ga4Service] Sending event to GA4: test_backend
```

---

## 🔍 Verificação no GA4

### **Método 1: DebugView (Tempo Real - Recomendado para testes)**

1. Acesse: https://analytics.google.com/
2. **Configure** → **DebugView**
3. Eventos devem aparecer em **segundos**

### **Método 2: Realtime Report**

1. **Reports** → **Realtime**
2. Eventos devem aparecer em até **30 segundos**

### **Método 3: Reports (Dados históricos)**

1. **Reports** → **Events**
2. Dados podem levar até **24-48 horas** para consolidar

---

## 🐛 Troubleshooting

### Problema: "gtag is not defined" no console

**Solução:** Verifique se `NEXT_PUBLIC_ENABLE_ANALYTICS=true` e `NEXT_PUBLIC_GA_MEASUREMENT_ID` estão configurados em `.env.local`.

### Problema: Eventos não aparecem no GA4

1. **Confirme que o Measurement ID está correto** (sem espaços/quebras de linha)
2. **Limpe cache do navegador** e recarregue a página
3. **Verifique se AdBlockers estão desabilitados**
4. **Use o DebugView** em vez de Reports normais (dados em tempo real)

### Problema: Backend retorna "ga4_enabled? → false"

**Solução:** Verifique se `GA4_MEASUREMENT_ID` e `GA4_API_SECRET` estão definidos em `AB0-1-back/.env` (sem espaços vazios).

Teste no Rails console:
```bash
rails console
> ENV['GA4_MEASUREMENT_ID']  # Deve retornar "G-XXXXXXXXXX"
> ENV['GA4_API_SECRET']      # Deve retornar seu secret
```

---

## 📊 Eventos Rastreados Automaticamente

Uma vez configurado, o sistema rastreará automaticamente:

### Frontend (gtag.js):
- Page views
- Company profile views
- CTA clicks (WhatsApp, Email, Phone, Website)
- Lead form submissions
- Search queries
- User interactions

### Backend (Measurement Protocol):
- Profile views (server-side)
- Lead creations
- Company activations
- Analytics reconciliation events

---

## 📚 Documentação de Referência

- **GA4 Setup Guide:** https://support.google.com/analytics/answer/9744165
- **Measurement Protocol:** https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **Data API (opcional):** https://developers.google.com/analytics/devguides/reporting/data/v1
- **DebugView:** https://support.google.com/analytics/answer/7201382

---

## ✅ Checklist Final

- [ ] Obter Measurement ID do GA4
- [ ] Obter API Secret do GA4
- [ ] Configurar `NEXT_PUBLIC_GA_MEASUREMENT_ID` no frontend (.env.local)
- [ ] Configurar `NEXT_PUBLIC_ENABLE_ANALYTICS=true` no frontend
- [ ] Configurar `GA4_MEASUREMENT_ID` no backend (.env)
- [ ] Configurar `GA4_API_SECRET` no backend (.env)
- [ ] Reiniciar servidor frontend (`npm run dev`)
- [ ] Reiniciar servidor backend (`rails s`)
- [ ] Testar evento no console do navegador
- [ ] Verificar evento no GA4 DebugView
- [ ] Testar envio do backend via rails runner
- [ ] Confirmar que eventos aparecem no GA4 Realtime

---

**Status:** ✅ Implementação completa - Aguardando apenas configuração de credenciais

**Próximo Passo:** Seguir Passo 1 acima para obter credenciais do Google Analytics
