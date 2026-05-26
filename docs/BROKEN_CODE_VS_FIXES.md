# Codigo Quebrado Vs Correcoes - Stripe Subscriptions

## Status Atual

Este documento foi atualizado depois do hotfix de webhook Stripe. Ele separa:

- corrigido no hotfix;
- pendente para billing SaaS;
- itens que nao devem ser alterados no fluxo legado.

---

## Corrigido No Hotfix

### 1. Header E Validacao Do Webhook Stripe

**Antes:** Stripe era validado como se enviasse `X-Webhook-Signature`.

**Depois:** `provider=stripe` usa `Stripe-Signature` e valida com:

```ruby
Stripe::Webhook.construct_event(payload, signature_header, secret)
```

O controller converte assinatura invalida em `401` e secret ausente em erro de configuracao.

### 2. Verificacao Manual Stripe

**Antes:** `Webhooks::SecurityService` recalculava assinatura Stripe manualmente.

**Depois:** `SecurityService` nao valida Stripe. Ele fica responsavel apenas por HMAC dos providers:

- `mock`
- `mercadopago`
- `pagarme`

### 3. `Plan#raw_feature_flags`

**Antes:** `PlansController#plan_payload` chamava um metodo inexistente.

**Depois:** `Plan#raw_feature_flags` existe e:

- retorna `features_json` quando presente;
- faz fallback para `features` em JSON string;
- retorna `{}` para vazio ou invalido.

---

## Nao Alterar No Hotfix

### Checkout Legado De Banner

`AB0-1-back/app/services/payment/checkout_service.rb` continua correto para o fluxo atual:

```ruby
mode: 'payment'
```

Esse service cobra banner como compra avulsa. Nao transformar esse fluxo em assinatura recorrente.

### Webhook Legado De Banner

`Webhooks::StripeHandler` ainda aponta para `BannerSubscription` no evento `checkout.session.completed`.

Isso e intencional ate o billing SaaS existir. A assinatura SaaS deve ganhar um handler/endpoint separado.

---

## Pendencias Para Billing SaaS

### 1. Campos Stripe Em `plans`

Criar migration para:

- `slug`
- `stripe_product_id`
- `stripe_monthly_price_id`
- `stripe_yearly_price_id`
- `active`
- `public`
- `sort_order`

### 2. Tabela `company_subscriptions`

Criar tabela para armazenar assinatura real da empresa:

- `company_id`
- `plan_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_checkout_session_id`
- `status`
- periodos de cobranca e trial
- `cancel_at_period_end`

### 3. Novo Checkout SaaS

Criar novo service:

```ruby
Billing::CheckoutService
```

Esse service deve usar:

```ruby
mode: 'subscription'
```

Ele tambem deve usar `price_id` recorrente da Stripe e idempotency key.

### 4. Endpoints Billing

Criar:

```text
GET  /api/v1/billing/plans
POST /api/v1/billing/checkout_sessions
POST /api/v1/billing/customer_portal
POST /api/v1/billing/webhooks/stripe
```

### 5. Webhook SaaS

Processar eventos de assinatura sem misturar com `BannerSubscription`:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Checklist Para Proxima Implementacao

- Criar schema antes do checkout recorrente.
- Manter banner one-time separado de SaaS billing.
- Criar testes de webhook com assinatura valida e invalida.
- Criar testes de idempotencia.
- Criar testes de autorizacao para checkout e portal.
- Rodar E2E em Stripe test mode antes de live mode.
