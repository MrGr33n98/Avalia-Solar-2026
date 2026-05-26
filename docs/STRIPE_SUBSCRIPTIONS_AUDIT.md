# Auditoria Tecnica - Stripe Subscriptions Avalia Solar

## Sumario

**Data base:** 26 de maio de 2026
**Projeto:** Avalia Solar, Rails 7.0.8 API + React/Next.js
**Objetivo:** implementar pagamento recorrente com Stripe para planos SaaS Free/Pro/Enterprise.
**Status pos-hotfix:** webhook Stripe legado e `Plan#raw_feature_flags` corrigidos; billing SaaS real ainda pendente.

Esta auditoria substitui os apontamentos pre-hotfix como fonte operacional. O score original `17.5/100` fica mantido apenas como historico do estado anterior ao hotfix.

---

## O Que Ja Foi Corrigido

- `PaymentsWebhooksController` trata `provider=stripe` separadamente.
- Stripe usa o header oficial `Stripe-Signature`.
- `Webhooks::StripeHandler` valida com `Stripe::Webhook.construct_event`.
- Erros de assinatura Stripe viram `401`; secret ausente vira erro de configuracao.
- `Webhooks::SecurityService` nao tenta validar Stripe manualmente.
- HMAC foi mantido para `mock`, `mercadopago` e `pagarme`.
- `Plan#raw_feature_flags` foi implementado e preserva o contrato de `PlansController`.

---

## Decisao Importante Sobre Checkout

`Payment::CheckoutService` pertence ao fluxo legado de compra avulsa de banner. Ele deve continuar usando:

```ruby
mode: 'payment'
```

Nao converter esse service para assinatura. A assinatura SaaS deve ser criada em um novo modulo, por exemplo:

```ruby
Billing::CheckoutService
```

Esse novo service deve usar Stripe Checkout com:

```ruby
mode: 'subscription'
```

---

## Estado Atual Do Backend

### Existe

- `Plan` como catalogo comercial basico.
- `features_json` em `plans`.
- `SubscriptionPlan` legado ligado a produto/categoria.
- `Company` com `plan_id` e `plan_status`.
- Webhook legado para banner via `BannerSubscription`.
- Stripe gem instalada.
- Checkout de banner com Stripe/MercadoPago.

### Ainda Nao Existe

- Campos Stripe em `plans`.
- `CompanySubscription`.
- Endpoints `/api/v1/billing/*`.
- Customer Portal.
- Checkout recorrente SaaS.
- Webhook SaaS separado.
- Testes E2E de assinatura recorrente.

---

## Pendencias Tecnicas Principais

### Schema SaaS

Adicionar aos planos:

- `slug`
- `stripe_product_id`
- `stripe_monthly_price_id`
- `stripe_yearly_price_id`
- `active`
- `public`
- `sort_order`

Criar `company_subscriptions` com:

- `company_id`
- `plan_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_checkout_session_id`
- `status`
- `current_period_start`
- `current_period_end`
- `trial_end`
- `cancel_at_period_end`

### Billing API

Criar endpoints separados do fluxo de banner:

```text
GET  /api/v1/billing/plans
POST /api/v1/billing/checkout_sessions
POST /api/v1/billing/customer_portal
POST /api/v1/billing/webhooks/stripe
```

### Webhooks SaaS

Eventos minimos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

O webhook SaaS deve ser idempotente e nao deve reutilizar a regra de `BannerSubscription`.

---

## Roadmap Recomendado

### Fase 0 - Validar Hotfix

- Rodar specs focadas de webhook e `Plan`.
- Testar evento Stripe de banner em staging.
- Confirmar respostas `401` e erro de configuracao.
- Confirmar que providers HMAC continuam funcionando.

### Fase 1 - Schema E Modelos SaaS

- Criar migrations de `plans` e `company_subscriptions`.
- Criar `CompanySubscription`.
- Adicionar associacoes em `Company` e `Plan`.
- Criar seeds de planos publicos.

### Fase 2 - Backend Billing

- Criar controllers em namespace `Api::V1::Billing`.
- Criar `Billing::CheckoutService` com `mode: 'subscription'`.
- Criar `Billing::PortalService`.
- Criar handler Stripe SaaS com idempotencia.

### Fase 3 - Frontend

- Conectar `/pricing` ao endpoint de checkout.
- Criar aba de plano e cobranca no dashboard.
- Criar estados de sucesso, cancelamento e erro.
- Manter Enterprise como contato comercial.

### Fase 4 - Hardening

- Testes de autorizacao.
- Testes de webhook com assinatura invalida.
- Testes de retry/idempotencia.
- E2E com Stripe test mode.
- Security review antes de live mode.

---

## Riscos Abertos

- Sem `CompanySubscription`, nao ha fonte canonica para assinatura SaaS por empresa.
- Sem idempotencia, retries de webhook podem duplicar efeitos.
- Sem Customer Portal, usuario nao consegue cancelar/alterar plano sozinho.
- Sem testes E2E, billing real nao deve ir para producao.

---

## Gate

**Hotfix legado:** pode seguir para CI/staging.
**Billing SaaS:** nao liberar em producao ate concluir schema, endpoints, frontend, testes e security review.
