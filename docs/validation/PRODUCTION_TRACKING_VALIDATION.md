# 🔍 VALIDAÇÃO DE TRACKING EM PRODUÇÃO

**Data:** 2026-03-05  
**Ambiente:** Production (avaliasolar.com.br)  
**Responsável:** Data Engineer + QA

---

## 1. CHECKLIST DE VALIDAÇÃO

### 1.1 Google Tag Manager

**URL de Teste:** https://avaliasolar.com.br

**Ferramentas:**
- Chrome DevTools (Network tab)
- Tag Assistant (Chrome Extension)
- GTM Preview Mode

**Validação:**

```markdown
## A. GTM Container Carregando

- [ ] Network tab mostra request para `https://www.googletagmanager.com/gtm.js?id=GTM-5RV76ZKR`
- [ ] Status: 200 OK
- [ ] Timing: <500ms
- [ ] Cache: cache-control header presente

**Screenshot necessário:** `gtm-network-request.png`

**Como validar:**
1. Abrir Chrome DevTools (F12)
2. Aba Network
3. Filtrar por "gtm"
4. Recarregar página
5. Screenshot do request com status 200

---

## B. GTM DataLayer Inicializado

- [ ] Console: `window.dataLayer` retorna array
- [ ] Console: `window.dataLayer.length > 0`
- [ ] Console: `window.dataLayer[0]` mostra `gtm.start`

**Screenshot necessário:** `gtm-datalayer-console.png`

**Comandos para testar:**
```javascript
// No console do Chrome
console.log('DataLayer exists:', typeof window.dataLayer !== 'undefined');
console.log('DataLayer length:', window.dataLayer?.length);
console.log('DataLayer content:', window.dataLayer);
```

---

## C. GTM Preview Mode

- [ ] Acessar https://tagmanager.google.com
- [ ] Workspace > Preview
- [ ] Conectar com https://avaliasolar.com.br
- [ ] Tag Assistant mostra container conectado

**Screenshot necessário:** `gtm-preview-connected.png`

**Tags que devem disparar:**
- [ ] Google Analytics: GA4 Configuration
- [ ] Google Consent Mode (default)
- [ ] (Futuro) Meta Pixel Base
- [ ] (Futuro) LinkedIn Insight Tag

---

## D. GTM Debug View

**Eventos que devem aparecer:**

1. **Page Load:**
   - [ ] `gtm.js` (Container Loaded)
   - [ ] `gtm.dom` (DOM Ready)
   - [ ] `gtm.load` (Window Loaded)

2. **User Interactions:**
   - [ ] `gtm.click` (se configurado)
   - [ ] Custom events do dataLayer

**Screenshot necessário:** `gtm-debug-events.png`

---

### 1.2 Google Analytics 4

**Validação:**

## A. GA4 Script Carregando

- [ ] Network tab mostra `https://www.googletagmanager.com/gtag/js?id=G-9SD4S6S434`
- [ ] Status: 200 OK
- [ ] `window.gtag` existe no console

**Screenshot necessário:** `ga4-script-loaded.png`

---

## B. GA4 DebugView

**Acesso:** https://analytics.google.com/analytics/web/#/p[PROPERTY_ID]/reports/explorer?params=_u..debugDeviceId

**Como ativar:**

1. **Método 1: Query Parameter**
   ```
   https://avaliasolar.com.br?debug_mode=true
   ```

2. **Método 2: Console**
   ```javascript
   // Habilitar debug temporariamente
   window.gtag('set', 'debug_mode', true);
   ```

3. **Método 3: Browser Extension**
   - Instalar "Google Analytics Debugger"
   - Ativar extensão
   - Recarregar página

**Eventos que devem aparecer:**

- [ ] `page_view` (automático)
- [ ] `session_start` (primeira visita)
- [ ] `first_visit` (nova sessão)
- [ ] Custom events se houver interação

**Screenshot necessário:** `ga4-debugview-events.png`

**Parâmetros que devem estar presentes:**
- [ ] `page_location`
- [ ] `page_referrer`
- [ ] `session_id` (via custom parameter)
- [ ] `company_id` (se contexto de empresa)

---

## C. GA4 Realtime Report

**Acesso:** GA4 > Reports > Realtime

- [ ] "Users in last 30 minutes" > 0
- [ ] Event count increasing
- [ ] Events by Event name mostra custom events

**Screenshot necessário:** `ga4-realtime-report.png`

---

### 1.3 Mixpanel

**Validação:**

## A. Mixpanel SDK Carregado

- [ ] Network tab mostra request para `https://cdn.mxpnl.com/libs/mixpanel-*.min.js`
- [ ] Status: 200 OK
- [ ] `window.mixpanel` existe no console

**Screenshot necessário:** `mixpanel-script-loaded.png`

---

## B. Mixpanel Events Firing

**Método 1: Network Tab**

- [ ] Filtrar por `api.mixpanel.com/track`
- [ ] POST requests com status 200
- [ ] Payload contém `event` e `properties`

**Screenshot necessário:** `mixpanel-network-requests.png`

**Exemplo de request:**
```json
{
  "event": "Page Viewed",
  "properties": {
    "distinct_id": "...",
    "token": "47aad0881cd4532d4295c4be5254fad8",
    "pathname": "/",
    "$current_url": "https://avaliasolar.com.br",
    "session_id": "...",
    "mp_lib": "web"
  }
}
```

---

**Método 2: Mixpanel Live View**

**Acesso:** https://mixpanel.com/report/[PROJECT_ID]/live

- [ ] Events stream mostrando eventos em tempo real
- [ ] Event properties corretas
- [ ] User properties (se identificado)

**Screenshot necessário:** `mixpanel-live-view.png`

---

## C. Mixpanel Consent Check

- [ ] Sem consentimento: Nenhum request para Mixpanel
- [ ] Com consentimento: Requests normais

**Teste:**
1. Abrir em aba anônima
2. Rejeitar cookies
3. Verificar Network tab (não deve ter mixpanel)
4. Aceitar cookies
5. Verificar Network tab (deve ter mixpanel)

**Screenshot necessário:** `mixpanel-consent-behavior.png`

---

### 1.4 Backend Analytics Endpoint

**Endpoint:** `POST https://api.avaliasolar.com.br/api/v1/analytics/track`

**Validação:**

## A. Endpoint Respondendo

- [ ] Network tab mostra requests para `/api/v1/analytics/track`
- [ ] Status: 200 OK (sucesso) ou 429 (rate limit esperado)
- [ ] Response time: <500ms P95

**Screenshot necessário:** `backend-analytics-requests.png`

---

## B. Payload Validation

**Exemplo de payload esperado:**
```json
{
  "event_id": "uuid-v4",
  "event_type": "page_view",
  "company_id": 123,
  "tracked_at": "2026-03-05T16:00:00.000Z",
  "metadata": {
    "session_id": "session_...",
    "pathname": "/companies/123",
    "utm_source": "google",
    "utm_medium": "cpc"
  }
}
```

**Validação:**
- [ ] `event_id` sempre presente (UUID v4)
- [ ] `event_type` válido
- [ ] `tracked_at` em ISO 8601
- [ ] `metadata` com `session_id`

---

## C. Rate Limiting

**Teste:**
```javascript
// Console do Chrome
for (let i = 0; i < 150; i++) {
  fetch('/api/v1/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'test_rate_limit',
      event_id: crypto.randomUUID(),
      tracked_at: new Date().toISOString()
    })
  }).then(r => console.log(`Request ${i}: ${r.status}`));
}
```

**Esperado:**
- Primeiros 100: Status 200
- Próximos 50: Status 429
- Header `Retry-After` presente no 429

**Screenshot necessário:** `backend-rate-limit-test.png`

---

### 1.5 Consent Mode v2

**Validação:**

## A. Consent Default State

**Console test:**
```javascript
// Verificar consent padrão
window.dataLayer.filter(item => 
  Array.isArray(item) && item[0] === 'consent' && item[1] === 'default'
);
```

**Esperado:**
```javascript
['consent', 'default', {
  'ad_storage': 'denied',
  'analytics_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'wait_for_update': 500
}]
```

**Screenshot necessário:** `consent-default-state.png`

---

## B. Consent Update on Accept

**Teste:**
1. Rejeitar cookies
2. Verificar dataLayer
3. Aceitar cookies
4. Verificar dataLayer novamente

**Esperado após aceitar:**
```javascript
['consent', 'update', {
  'ad_storage': 'granted',
  'analytics_storage': 'granted',
  'ad_user_data': 'granted',
  'ad_personalization': 'granted'
}]
```

**Screenshot necessário:** `consent-update-granted.png`

---

## 2. SCRIPT DE AUTOMAÇÃO CYPRESS

```typescript
// cypress/e2e/production-tracking-validation.cy.ts
describe('Production Tracking Validation', () => {
  beforeEach(() => {
    cy.visit('https://avaliasolar.com.br');
  });
  
  it('GTM container loads', () => {
    cy.window().then((win) => {
      expect(win.dataLayer).to.exist;
      expect(win.dataLayer.length).to.be.greaterThan(0);
    });
  });
  
  it('GA4 script loads', () => {
    cy.window().then((win) => {
      expect(win.gtag).to.exist;
    });
  });
  
  it('Mixpanel loads after consent', () => {
    cy.wait(2100); // Banner delay
    cy.get('[data-testid="cookie-accept"]').click();
    
    cy.window().then((win) => {
      expect(win.mixpanel).to.exist;
    });
  });
  
  it('Backend analytics endpoint responds', () => {
    cy.request({
      method: 'POST',
      url: 'https://api.avaliasolar.com.br/api/v1/analytics/track',
      failOnStatusCode: false,
      body: {
        event_type: 'cypress_test',
        event_id: 'test-' + Date.now(),
        tracked_at: new Date().toISOString(),
        metadata: { test: true }
      },
      headers: {
        'X-QA-Session': 'true'
      }
    }).then((response) => {
      expect(response.status).to.be.oneOf([200, 400]); 
    });
  });
  
  it('Consent mode default is denied', () => {
    cy.window().then((win) => {
      const consentDefault = win.dataLayer.find((item: any) =>
        Array.isArray(item) && item[0] === 'consent' && item[1] === 'default'
      );
      
      expect(consentDefault[2]).to.include({
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    });
  });
});
```

---

## 3. TROUBLESHOOTING

### GTM não carregando

**Possíveis causas:**
1. Bloqueado por adblocker
2. Network error
3. Container ID incorreto
4. ENV var `NEXT_PUBLIC_ENABLE_ANALYTICS=false`

**Como debugar:**
```javascript
// Console
console.log('Analytics enabled:', process.env.NEXT_PUBLIC_ENABLE_ANALYTICS);
console.log('GTM ID:', process.env.NEXT_PUBLIC_GTM_ID);
```

---

### GA4 não recebendo eventos

**Possíveis causas:**
1. Measurement ID incorreto
2. Consent não dado
3. Ad blocker ativo
4. Data Stream pausado

**Como debugar:**
1. Verificar GA4 Admin > Data Streams > Web stream status
2. Testar com `?debug_mode=true`
3. Verificar console errors

---

### Mixpanel não tracking

**Possíveis causas:**
1. Token inválido
2. Consent não dado
3. Projeto Mixpanel arquivado
4. Quota excedida

**Como debugar:**
```javascript
// Console
mixpanel.get_property('token'); // Deve retornar token
mixpanel.get_distinct_id(); // Deve retornar ID
```

---

### Backend retornando 400

**Possíveis causas:**
1. `event_type` ausente
2. `company_id` ausente (quando obrigatório)
3. JSON inválido
4. `tracked_at` em formato incorreto

**Como debugar:**
```bash
curl -X POST https://api.avaliasolar.com.br/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "event_id": "test-123",
    "tracked_at": "2026-03-05T16:00:00.000Z",
    "company_id": 1,
    "metadata": {}
  }'
```

---

## 4. RELATÓRIO DE VALIDAÇÃO

**Template:**

```markdown
# Relatório de Validação - Produção

**Data:** [Data de execução]  
**Ambiente:** https://avaliasolar.com.br  
**Testador:** [Nome]

## Resumo Executivo

- [ ] GTM Container: **PENDENTE**
- [ ] GA4 Tracking: **PENDENTE**
- [ ] Mixpanel: **PENDENTE**
- [ ] Backend API: **PENDENTE**
- [ ] Consent Mode: **PENDENTE**

## Detalhes

### GTM
- Container ID: GTM-5RV76ZKR
- Status: [ ] OK [ ] FALHA
- DataLayer: [ ] Inicializado
- Preview Mode: [ ] Testado
- Tags disparando: __/3

### GA4
- Measurement ID: G-9SD4S6S434
- DebugView: [ ] OK [ ] FALHA
- Realtime: [ ] OK [ ] FALHA
- Custom parameters: company_id [ ], session_id [ ]

### Mixpanel
- Token: 47aa...fad8
- Events firing: [ ] OK [ ] FALHA
- Live View: [ ] OK [ ] FALHA
- Consent behavior: [ ] OK [ ] FALHA

### Backend
- Endpoint: /api/v1/analytics/track
- Status: [ ] 200 OK [ ] Erro
- Rate limiting: [ ] Ativo [ ] Inativo
- Response time: P95 ~___ms

### Consent
- Banner: [ ] Visível [ ] Ausente
- Default state: [ ] Denied [ ] Incorreto
- Update on accept: [ ] Granted [ ] Incorreto
- GTM integration: [ ] OK [ ] FALHA

## Issues Encontrados

1. [Descrever issue]
2. [Descrever issue]

## Screenshots Anexados

- [ ] gtm-network-request.png
- [ ] ga4-debugview-events.png
- [ ] mixpanel-live-view.png
- [ ] backend-analytics-requests.png
- [ ] consent-default-state.png

## Próximas Ações

1. [Ação corretiva]
2. [Ação corretiva]

## Assinaturas

**Testador:** _______________  
**Data Engineer:** _______________  
**Data:** [Data]
```

---

## 5. SCHEDULE DE VALIDAÇÃO

**Frequência:** Mensal ou após deploy major

**Responsáveis:**
- QA Engineer: Executar testes
- Data Engineer: Validar resultados
- DevOps: Automatizar no CI/CD

**Próxima validação:** 2026-04-05

---

**Status Atual:** ❌ **NÃO EXECUTADO**

**Documento criado:** 2026-03-05  
**Versão:** 1.0  
**Aguardando:** Execução manual ou automação CI/CD
