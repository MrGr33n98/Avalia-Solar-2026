# Diagnóstico: Falha na Consolidação de Dados no GA4

**Data:** 2026-03-09
**Analista:** GitHub Copilot CLI

---

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Variáveis de Ambiente GA4 Não Configuradas**

**Status:** ❌ CRÍTICO

**Backend:**
```
GA4_MEASUREMENT_ID: NOT SET
GA4_API_SECRET: NOT SET
GA4_SERVICE_ACCOUNT_JSON: NOT SET
```

**Frontend:**
- Não existe `NEXT_PUBLIC_GA_MEASUREMENT_ID` no `.env.example`
- Não existe `NEXT_PUBLIC_GA4_MEASUREMENT_ID` configurado
- GTM ID também não está configurado (`NEXT_PUBLIC_GTM_ID`)

**Impacto:** 
- Nenhum evento está sendo enviado para o GA4
- O código está implementado mas inativo por falta de credenciais
- Analytics está completamente desabilitado (`NEXT_PUBLIC_ENABLE_ANALYTICS=false`)

---

### 2. **Script GA4 Não Está Carregado no Frontend**

**Status:** ❌ CRÍTICO

**Verificação:**
- Busca no `app/layout.tsx` não encontrou referências ao GA4/gtag
- O script do Google Tag não está sendo injetado no HTML
- `initializeGTag()` nunca é chamado porque o script base não existe

**Código presente mas não utilizado:**
- ✅ `lib/analytics/ga4.ts` - Wrapper implementado
- ✅ `lib/analytics/gtag.ts` - Helper functions prontas
- ❌ Nenhuma inicialização no layout raiz
- ❌ Nenhum `<Script>` tag com gtag.js

---

### 3. **Falta de Inicialização no Frontend**

**Arquivos implementados:**
```
AB0-1-front/lib/analytics/
  ├── ga4.ts ✅ (wrapper)
  ├── gtag.ts ✅ (functions)
  └── useAnalytics.ts ✅ (hook)
```

**O que falta:**
1. Adicionar Google Tag script no `app/layout.tsx`
2. Chamar `initializeGTag(measurementId)` no carregamento inicial
3. Configurar `NEXT_PUBLIC_GA_MEASUREMENT_ID` em `.env`

---

### 4. **Backend: Envio Assíncrono para GA4 Implementado MAS Inativo**

**Fluxo atual:**

```ruby
# ✅ Implementado em app/workers/analytics_tracking_job.rb
def forward_to_ga4(event_name, properties, metadata)
  Ga4Service.track(event_name, properties.merge(metadata))
end
```

```ruby
# ✅ Implementado em app/services/ga4_service.rb
def track(event_name, properties)
  return unless ga4_enabled?  # ⚠️ RETORNA FALSO - ENV NÃO CONFIGURADA
  
  payload = build_measurement_payload(event_name, properties)
  Thread.new { send_to_ga4(payload) }
end
```

**Problema:**
- `ga4_enabled?` verifica `ENV['GA4_MEASUREMENT_ID']` e `ENV['GA4_API_SECRET']`
- Como ambos estão vazios, **TODOS** os eventos são descartados silenciosamente
- O backend NÃO está enviando eventos para o GA4 Measurement Protocol

---

### 5. **Banco de Dados Não Está Disponível (Secundário)**

**Status:** ⚠️ WARN

```
ActiveRecord::NoDatabaseError: We could not find your database: avalia_solar_development
```

**Impacto:**
- Impossível verificar se eventos estão sendo salvos localmente em `analytics_events`
- Reconciliação de dados em `analytics_reconciliations` não funciona
- Dashboard interno de analytics indisponível

**Nota:** Este é um problema separado mas impede validação local dos dados.

---

## 📊 FLUXO DE DADOS ESPERADO vs REAL

### **Esperado:**

```
Frontend                    Backend                     GA4
   ↓                           ↓                         ↓
gtag('event')  →  POST /api/analytics  →  analytics_events (DB)
                                 ↓
                      AnalyticsTrackingJob (Sidekiq)
                                 ↓
                      Ga4Service.track() → Measurement Protocol
                                              ↓
                                         Google Analytics 4
```

### **Real (Atual):**

```
Frontend                    Backend                     GA4
   ↓                           ↓                         ↓
❌ gtag não existe   →  ✅ API funciona   →  ❌ DB offline
                                 ↓
                      ✅ Job implementado
                                 ↓
                      ❌ ga4_enabled? → false (ENV vazia)
                                 ↓
                              return nil
```

---

## ✅ CHECKLIST DE CORREÇÃO

### **Fase 1: Configurar Credenciais (URGENTE)**

#### Backend (.env)
```bash
# Obter em: https://console.cloud.google.com/apis/credentials
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=seu_api_secret_aqui

# Opcional: Para importar métricas de engajamento via Data API
GA4_SERVICE_ACCOUNT_JSON='{"type": "service_account", ...}'
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

---

### **Fase 2: Injetar Script GA4 no Frontend**

**Arquivo:** `AB0-1-front/app/layout.tsx`

Adicionar após `<body>`:

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  return (
    <html>
      <body>
        {GA_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                    send_page_view: false
                  });
                `,
              }}
            />
          </>
        )}
        {children}
      </body>
    </html>
  )
}
```

---

### **Fase 3: Criar Database (Para validação local)**

```bash
cd AB0-1-back
rails db:create
rails db:migrate
rails db:seed  # Opcional
```

---

### **Fase 4: Validar Envio**

#### Teste Frontend:
```javascript
// No console do navegador (F12)
gtag('event', 'test_event', { company_id: '123', debug_mode: true })
```

Verificar no **GA4 DebugView:** https://analytics.google.com/analytics/web/#/a<property-id>/debugview

#### Teste Backend:
```bash
cd AB0-1-back
rails runner "Ga4Service.track('backend_test', { company_id: 999, test: true })"
```

Monitorar logs:
```bash
tail -f log/development.log | grep GA4
```

---

## 📋 DOCUMENTAÇÃO DE REFERÊNCIA

### **Como Obter Credenciais GA4:**

1. **Measurement ID (G-XXXXXXXXXX):**
   - Acesse: https://analytics.google.com/
   - Admin → Data Streams → Selecione seu stream
   - Copie o **Measurement ID**

2. **API Secret (Measurement Protocol):**
   - Mesma tela acima → "Measurement Protocol API secrets"
   - Create → Copie o secret

3. **Service Account JSON (Opcional - Para Data API):**
   - https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create Service Account
   - Grant role: "Viewer" no projeto do GA4
   - Create Key (JSON) → Download

---

## 🎯 PRÓXIMOS PASSOS RECOMENDADOS

1. ✅ **[URGENTE]** Configurar `GA4_MEASUREMENT_ID` e `GA4_API_SECRET` no backend
2. ✅ **[URGENTE]** Configurar `NEXT_PUBLIC_GA_MEASUREMENT_ID` no frontend
3. ✅ **[URGENTE]** Adicionar script gtag.js no `app/layout.tsx`
4. ⚠️ **[IMPORTANTE]** Criar banco de dados: `rails db:create db:migrate`
5. ⚠️ **[IMPORTANTE]** Habilitar analytics: `NEXT_PUBLIC_ENABLE_ANALYTICS=true`
6. 🔄 **[OPCIONAL]** Configurar Service Account para importar métricas de engajamento
7. ✅ **[VALIDAÇÃO]** Testar envio via DebugView do GA4

---

## 🔍 ANÁLISE DE IMPACTO

| Componente | Status | Envio para GA4 | Solução |
|-----------|--------|----------------|---------|
| Frontend gtag.js | ❌ Ausente | ❌ Não envia | Injetar script + ENV |
| Backend Measurement Protocol | ⚠️ Implementado mas inativo | ❌ Não envia | Configurar ENV |
| Banco analytics_events | ❌ Offline | N/A | `rails db:create` |
| Job assíncrono | ✅ OK | ❌ Bloqueado | Depende de ENV |
| Código GA4Service | ✅ OK | ❌ Bloqueado | Depende de ENV |

**Conclusão:** O sistema está 100% implementado mas 0% funcional por falta de configuração de credenciais.

---

## 📞 CONTATOS DE SUPORTE

- **GA4 Help:** https://support.google.com/analytics/answer/9744165
- **Measurement Protocol:** https://developers.google.com/analytics/devguides/collection/protocol/ga4
- **Data API:** https://developers.google.com/analytics/devguides/reporting/data/v1

---

**Gerado automaticamente por `npx analytics analise`**
