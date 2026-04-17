# 🚀 DEV PROMPT - DASHBOARD FIXES P0

## CONTEXTO

Sistema Avalia Solar com dashboards funcionais mas **3 bugs críticos** que causam crashes em produção. Análise técnica completa em `ANALISE_TECNICA_DASHBOARDS_FINAL.md`.

## OBJETIVO P0 (48h)

Resolver crashes JavaScript no review dashboard sem quebrar funcionalidades existentes.

---

## 🔥 **TASK 1: FIX COMPANY INTERFACE TYPING**

### **Problema**
- `QuotesPanel.tsx:104` → `quote.company?.substring(0, 2)` 
- Backend retorna objeto: `{id, name, logo_url}`
- Frontend espera string → **TypeError**

### **Solução**
```typescript
// Em QuotesPanel.tsx linha ~104
// ❌ ATUAL
{quote.company?.substring(0, 2).toUpperCase() || 'ES'}

// ✅ NOVO  
{typeof quote.company === 'string' 
  ? quote.company.substring(0, 2).toUpperCase()
  : quote.company?.name?.substring(0, 2).toUpperCase() || 'ES'
}
```

### **Validação**
- [ ] Dashboard `/review-dashboard` carrega sem erro no console
- [ ] Initials aparecem corretamente para companies objeto e string
- [ ] Não quebra quotes existentes

---

## 🔒 **TASK 2: PROVIDER ALLOWLIST WEBHOOK**

### **Problema**  
- `routes.rb:100` → `/payments/webhooks/:provider` aceita qualquer provider
- Risco spoofing de transações

### **Solução**
```ruby
# Em app/controllers/api/v1/payments_webhooks_controller.rb
class Api::V1::PaymentsWebhooksController < ActionController::API
  ALLOWED_PROVIDERS = %w[stripe mercadopago pagarme mock].freeze
  
  before_action :validate_provider
  
  def create
    # código existente...
  end
  
  private
  
  def validate_provider
    return if ALLOWED_PROVIDERS.include?(params[:provider])
    render json: { error: 'Invalid provider' }, status: :unprocessable_entity
  end
end
```

### **Validação**
- [ ] Provider 'stripe' → HTTP 200
- [ ] Provider 'unknown' → HTTP 422 
- [ ] Provider 'mock' continua funcionando (manter compatibilidade)

---

## 📝 **TASK 3: AJUSTAR CONTRATO LEAD OBJECT**

### **Problema**
- `leads_controller.rb:56` serializa company como objeto
- Frontend não tem fallback seguro

### **Solução**
```typescript
// Em lib/api.ts ~linha 289
export interface Lead {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  company?: string | { id?: number; name: string; logo_url?: string }; // ✅ Union type
  category?: string;
  // ... resto igual
}
```

### **Validação** 
- [ ] TypeScript compila sem erros
- [ ] QuotesPanel funciona com ambos formatos
- [ ] Não quebra serialização existente

---

## 🧪 **TESTES OBRIGATÓRIOS**

### **Unit Tests**
```javascript
// tests/QuotesPanel.test.tsx
describe('Company display', () => {
  it('handles string company', () => {
    const quote = { id: 1, company: 'Solar Co' }
    // render + expect initials 'SO'
  })
  
  it('handles object company', () => {
    const quote = { id: 1, company: { name: 'Solar Co' } }
    // render + expect initials 'SO'  
  })
})
```

### **Integration Test**  
```ruby
# spec/controllers/payments_webhooks_controller_spec.rb
describe 'POST #create' do
  it 'rejects unknown provider' do
    post :create, params: { provider: 'unknown', status: 'paid' }
    expect(response).to have_http_status(422)
  end
end
```

---

## ✅ **DEFINITION OF DONE**

### **Funcional**
- [ ] Review dashboard (`/review-dashboard`) carrega sem crash
- [ ] Quotes panel exibe companies corretamente (string + objeto)
- [ ] Webhook rejeita providers não permitidos
- [ ] Testes unitários passam
- [ ] TypeScript compila sem erros

### **Técnico** 
- [ ] Console.log sem erros TypeError
- [ ] Network tab: webhook unknown → 422
- [ ] Backward compatibility mantida
- [ ] Code review aprovado

### **Deploy Ready**
- [ ] Smoke test review dashboard ✅
- [ ] Rollback plan preparado
- [ ] Não quebra funcionalidades existentes

---

## 🚨 **RESTRIÇÕES**

### **NÃO FAZER**
- ❌ Alterar `leads_controller.rb` (backend funciona)
- ❌ Quebrar quotes existentes em produção  
- ❌ Remover provider 'mock' (usado em testes)
- ❌ Mudanças em CSS/styling (fora de escopo)

### **FAZER SEMPRE**
- ✅ Testar ambos formatos (string + objeto)
- ✅ Manter backward compatibility
- ✅ Validar no console browser (F12)
- ✅ Commit atômico por task

---

## 📋 **ARQUIVOS PARA MODIFICAR**

1. `AB0-1-front/app/review-dashboard/components/QuotesPanel.tsx` (linha ~104)
2. `AB0-1-front/lib/api.ts` (linha ~289 - interface Lead)
3. `AB0-1-back/app/controllers/api/v1/payments_webhooks_controller.rb` (adicionar validação)

## 🔍 **EVIDÊNCIAS DE SUCESSO**

- Screenshot: Dashboard review sem erro console
- GIF: Navigation quotes funcionando
- Test coverage: >90% nos componentes modificados

---

**⏰ Timeline: 48h | Owner: Dev Team | Priority: P0 | Status: Ready to Start**