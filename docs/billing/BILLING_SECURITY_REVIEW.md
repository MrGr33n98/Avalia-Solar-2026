# Revisão de Segurança: Billing SaaS Stripe

**Data:** 2026-05-26  
**Versão:** 1.0  
**Status:** Draft — revisão obrigatória antes da implementação

---

## 1. Superfície de Ataque

### Endpoints Novos

| Endpoint | Risco | Proteção Necessária |
|---|---|---|
| `POST /api/v1/billing/webhooks/stripe` | Alto | Validação de assinatura, idempotência |
| `POST /api/v1/billing/checkout_sessions` | Médio | Auth, autorização, rate limiting |
| `POST /api/v1/billing/customer_portal` | Médio | Auth, só para dono da empresa |
| `GET /api/v1/billing/current_subscription` | Baixo | Auth, isolamento por empresa |
| `GET /api/v1/billing/plans` | Baixo | Público, sem dados sensíveis |

---

## 2. Segurança de Webhook

### 2.1 Validação Oficial Stripe SDK

```ruby
# CORRETO — usar sempre Stripe::Webhook.construct_event
event = Stripe::Webhook.construct_event(
  payload_body,
  stripe_signature_header,
  ENV.fetch('STRIPE_BILLING_WEBHOOK_SECRET')
)
```

**Nunca:**
- Parsear JSON do payload antes de verificar assinatura
- Comparar strings de assinatura manualmente
- Usar `ENV['STRIPE_WEBHOOK_SECRET']` (do legado) para billing SaaS

### 2.2 Segredo Separado

```
STRIPE_WEBHOOK_SECRET         → legado (banner)
STRIPE_BILLING_WEBHOOK_SECRET → novo (billing SaaS)
```

Cada webhook endpoint no Stripe Dashboard deve ter seu próprio segredo. **Nunca compartilhar segredos entre endpoints diferentes.**

### 2.3 Proteção contra Replay

A assinatura Stripe já inclui proteção contra replay via timestamp embutido. A gem Stripe verifica que o timestamp está dentro de 5 minutos por padrão.

Adicional: registrar `event.id` em `billing_stripe_events` antes de processar — rejeitar duplicatas com `200 OK` (não `4xx`, para evitar retries desnecessários do Stripe).

### 2.4 Proteção contra Eventos Fora de Ordem

Eventos Stripe podem chegar fora de ordem. Estratégia defensiva:

```ruby
# Antes de atualizar CompanySubscription, verificar se o evento é mais recente
def should_apply_update?(stripe_subscription)
  current = Billing::CompanySubscription.find_by(
    stripe_subscription_id: stripe_subscription.id
  )
  return true if current.nil? || current.last_synced_at.nil?

  # Apenas aplicar se evento é mais recente que o último sync
  stripe_subscription.current_period_end > current.current_period_end.to_i
end
```

### 2.5 Rate Limiting do Webhook

O endpoint de webhook SaaS deve ter rate limiting próprio via `rack-attack`:

```ruby
# config/initializers/rack_attack.rb
Rack::Attack.throttle('billing/webhook', limit: 100, period: 60) do |req|
  req.path == '/api/v1/billing/webhooks/stripe' ? 'billing_webhook' : nil
end
```

---

## 3. Autorização por Empresa

### 3.1 Isolamento Estrito

**Todo endpoint autenticado de billing deve verificar:**
1. Usuário tem sessão válida
2. Usuário é membro ativo da empresa requisitada
3. Usuário tem permissão para a ação específica (usar `BillingPolicy`)

```ruby
# Padrão em todos os controllers de billing
before_action :authenticate_user!
before_action :require_company_member!

def require_company_member!
  unless current_user_member_of?(current_company)
    render json: { error: 'Acesso negado' }, status: :forbidden
  end
end
```

### 3.2 Quem Pode Contratar/Alterar Plano

| Ação | Permissão |
|---|---|
| Ver plano atual | Qualquer membro da empresa |
| Iniciar checkout (upgrade) | Owner ou admin da empresa |
| Abrir Customer Portal | Owner ou admin da empresa |
| Ver histórico de billing | Owner ou admin da empresa |
| Cancelar assinatura | Owner da empresa apenas |

### 3.3 Quem Pode Administrar no ActiveAdmin

| Ação | Role Mínima |
|---|---|
| Ver lista de assinaturas | Qualquer admin logado |
| Ver detalhes de assinatura | Qualquer admin logado |
| Sincronizar com Stripe | `billing_support` |
| Registrar observação | `billing_support` |
| Marcar como Enterprise | `billing_finance` |
| Forçar downgrade | `billing_finance` |
| Cancelar no fim do período | `billing_finance` |
| Alterar Stripe IDs | `billing_super_admin` |
| Reprocessar webhook | `billing_super_admin` |

---

## 4. PCI Compliance

### 4.1 Stripe Hosted Checkout (PCI SAQ A)

O sistema DEVE usar exclusivamente:
- `Stripe::Checkout::Session` (modo `subscription`) → Hosted Checkout
- `Stripe::BillingPortal::Session` → Customer Portal

**Nunca:**
- Coletar dados de cartão em formulários próprios
- Armazenar número de cartão, CVV, data de expiração
- Passar dados de cartão pelo backend próprio

### 4.2 Dados Permitidos para Armazenar

| Campo | Permitido | Observação |
|---|---|---|
| `stripe_customer_id` | ✅ | Referência ao customer Stripe |
| `stripe_subscription_id` | ✅ | Referência à subscription |
| `stripe_price_id` | ✅ | Referência ao price |
| Status da assinatura | ✅ | Estado de billing |
| Datas do período | ✅ | Para feature gates |
| Motivo de falha de pagamento | ✅ (sem cartão) | Apenas texto descritivo |
| **Número do cartão** | ❌ NUNCA | Violação PCI |
| **CVV** | ❌ NUNCA | Violação PCI |
| **Nome no cartão** | ❌ | Desnecessário |
| **Payload completo do webhook** | ⚠️ Cuidado | Pode conter dados sensíveis — filtrar |

### 4.3 Payload do Webhook

```ruby
# Ao salvar raw_payload em billing_stripe_events, remover campos sensíveis
SENSITIVE_FIELDS = %w[number exp_month exp_year cvc last4 brand].freeze

def sanitize_payload(payload)
  payload.deep_transform_values do |value|
    # Não remover, mas o Stripe nunca envia dados completos de cartão em webhooks
    # mesmo assim, aplicar filtro defensivo
    value
  end
end
```

---

## 5. Proteção de Dados (LGPD / PII)

### 5.1 Dados no Slack

**Permitido no Slack:**
- Nome da empresa (razão social)
- ID da empresa
- Plano contratado
- Status da assinatura
- Motivo genérico de falha

**Proibido no Slack:**
- CPF/CNPJ completo
- Email do usuário responsável
- Telefone
- Dados de cartão
- Stripe secret keys
- Payload completo do webhook
- IP do cliente

### 5.2 Dados nos Logs

```ruby
# Filtrar nos logs do Rails
config.filter_parameters += [
  :stripe_secret_key,
  :card_number,
  :cvv,
  :password,
  :token
]
```

### 5.3 Dados na Auditoria Admin

**Lograr na tabela `billing_admin_actions`:**
- `admin_user_id`, `company_id`, `action_type`, `justification`
- **Não lograr:** dados financeiros detalhados, payloads completos

---

## 6. Proteção de Stripe IDs no Frontend

### 6.1 O Que Não Expor

| Campo | Expor? | Razão |
|---|---|---|
| `stripe_customer_id` | ❌ | Pode ser usado para acessar dados do cliente no Stripe |
| `stripe_subscription_id` | ❌ | Mesmo motivo |
| `stripe_price_id` | ⚠️ | Apenas se necessário para UX |
| Status da assinatura | ✅ | Necessário para UX |
| Datas do período | ✅ | Necessário para UX |
| Plano atual | ✅ | Necessário para UX |

```ruby
# Serializer correto
class Billing::SubscriptionSerializer < ActiveModel::Serializer
  attributes :status, :plan_name, :current_period_end, :cancel_at_period_end,
             :trial_end, :is_trialing

  # NÃO incluir: stripe_customer_id, stripe_subscription_id
end
```

---

## 7. Proteção contra Alteração Manual Indevida

### 7.1 Regras de Negócio Impossíveis de Criar

| Estado Impossível | Proteção |
|---|---|
| `status: active` sem `stripe_subscription_id` (exceto manual) | Validação no model |
| `status: manual` com `stripe_subscription_id` | Validação no model |
| Plan Enterprise sem `is_enterprise_manual` ou subscription ativa | Validação |
| Downgrade sem justificativa registrada | `AdminSubscriptionService` obriga |
| Alteração de Stripe ID sem role `super_admin` | Policy no ActiveAdmin |

### 7.2 Confirmações Obrigatórias no ActiveAdmin

Ações destrutivas devem exigir confirmação explícita:

```ruby
# Exemplo de member action com confirmação
member_action :force_downgrade, method: :post do
  # Exige parâmetro 'justification' no request
  if params[:justification].blank?
    redirect_to resource_path, alert: 'Justificativa obrigatória para esta ação'
    return
  end
  # ... executar ação
end
```

---

## 8. Estratégia para Eventos Duplicados

```
Política: Retornar 200 OK para duplicatas sem processar

Fluxo:
1. Receber evento
2. Verificar billing_stripe_events.stripe_event_id
3. Se existe: log 'duplicate_event', return 200 OK
4. Se não existe: inserir com status 'processing', processar, atualizar status

Por que 200 OK e não 4xx?
Responder 4xx faria o Stripe tentar novamente, causando mais duplicatas.
O comportamento correto é: "recebi, mas já processei, obrigado".
```

---

## 9. Estratégia para Eventos Fora de Ordem

Cenário: `customer.subscription.updated` chega antes de `customer.subscription.created`

```ruby
# Usar find_or_initialize_by + upsert defensivo
sub = Billing::CompanySubscription.find_or_initialize_by(
  stripe_subscription_id: stripe_sub.id
)
# Apenas atualizar campos que são "mais novos"
# Checar current_period_end para ordenação lógica
```

Cenário: `customer.subscription.deleted` chega antes de `invoice.payment_failed`

```ruby
# Processamento independente: cada evento age sobre o estado atual
# deleted sempre ganha — se subscription foi deletada, status = canceled
```

---

## 10. Auditoria de Toda Ação Manual

```ruby
# Obrigatório: toda ação via Billing::AdminSubscriptionService registra em billing_admin_actions
# Impossível chamar ações sem passar admin_user e justification
# Não há método sem auditoria no AdminSubscriptionService

class AdminSubscriptionService
  def initialize(company:, admin_user:, justification:)
    raise ArgumentError, 'admin_user obrigatório' if admin_user.nil?
    raise ArgumentError, 'justification obrigatória' if justification.blank?
    # ...
  end
end
```

---

## 11. Checklist de Segurança Pré-Launch

### Obrigatórios (bloqueantes)

- [ ] `STRIPE_BILLING_WEBHOOK_SECRET` separado do legado configurado
- [ ] Tabela `billing_stripe_events` criada com índice UNIQUE em `stripe_event_id`
- [ ] Webhook handler usando `Stripe::Webhook.construct_event` com SDK oficial
- [ ] Nenhum dado de cartão sendo logado ou armazenado
- [ ] Endpoints billing com autenticação obrigatória (exceto webhook e plans)
- [ ] BillingPolicy implementada e sendo usada em todos controllers
- [ ] Rate limiting no endpoint de webhook
- [ ] Validação de ambiente (sk_live em produção obrigatório)

### Recomendados (não-bloqueantes para v1)

- [ ] Roles de billing no AdminUser implementados
- [ ] Todos os admin actions com confirmação UI obrigatória
- [ ] Slack notifications para eventos críticos usando Sidekiq (não Thread)
- [ ] Filtros de PII configurados nos logs do Rails
- [ ] Testes de assinatura inválida cobrindo edge cases

### Nice-to-have

- [ ] IP allowlisting para endpoint de webhook (IPs do Stripe)
- [ ] Alertas de divergência automatizados (job periódico)
- [ ] Monitoramento de latência do webhook via Prometheus/Scout
