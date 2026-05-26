# Template PR + Implementation Guide

## Stripe Subscriptions - Pos-Hotfix

Este guia parte do estado atual:

- hotfix de webhook Stripe aplicado;
- `Plan#raw_feature_flags` aplicado;
- checkout legado de banner mantido como compra avulsa;
- billing SaaS ainda pendente.

---

## PR Ja Concluido

### Hotfix: Webhook Seguro + Bug De Planos

**Commit esperado:** `fix: secure stripe webhook hotfix`

Inclui:

- `Stripe-Signature` para Stripe.
- `Stripe::Webhook.construct_event`.
- remocao da verificacao manual Stripe.
- HMAC mantido para providers nao Stripe.
- `Plan#raw_feature_flags`.
- tests/specs focados para webhook e `Plan`.

Validar em CI/staging antes de iniciar billing SaaS.

---

## Proximos PRs Recomendados

### PR 1: Schema SaaS

**Branch:** `feature/billing-schema`

Criar campos Stripe em `plans`:

- `slug`
- `stripe_product_id`
- `stripe_monthly_price_id`
- `stripe_yearly_price_id`
- `active`
- `public`
- `sort_order`

Criar `company_subscriptions` com referencias para `company` e `plan`, Stripe IDs, status, periodo atual, trial e cancelamento ao fim do periodo.

**Nao fazer neste PR:** checkout, webhooks SaaS ou frontend.

### PR 2: Models E Seeds

**Branch:** `feature/billing-models`

Adicionar:

- `CompanySubscription`.
- associacoes em `Company` e `Plan`.
- scopes de status ativo/trial.
- seeds para `free`, `pro` e `enterprise`.

**Nao remover:** `SubscriptionPlan`, pois ainda e legado de outro fluxo.

### PR 3: Billing API Backend

**Branch:** `feature/billing-api`

Adicionar endpoints:

```text
GET  /api/v1/billing/plans
POST /api/v1/billing/checkout_sessions
POST /api/v1/billing/customer_portal
POST /api/v1/billing/webhooks/stripe
```

Criar services:

- `Billing::CheckoutService`
- `Billing::PortalService`
- `Billing::StripeWebhookHandler`

O novo checkout SaaS deve usar:

```ruby
mode: 'subscription'
```

**Importante:** nao alterar `Payment::CheckoutService`, que continua sendo compra avulsa de banner.

### PR 4: Frontend Billing

**Branch:** `feature/billing-frontend`

Conectar:

- `/pricing` ao checkout SaaS.
- dashboard a plano atual e Customer Portal.
- estados de sucesso/cancelamento/erro.

Enterprise deve continuar como contato comercial.

### PR 5: Security, QA E Observabilidade

**Branch:** `test/billing-hardening`

Adicionar:

- specs de webhook com assinatura valida e invalida;
- testes de idempotencia;
- testes de autorizacao por empresa;
- E2E em Stripe test mode;
- logs seguros sem secrets;
- smoke test de staging.

---

## PR Template

```markdown
## Description

Resumo curto do que este PR entrega.

## Scope

- [ ] Schema
- [ ] Backend API
- [ ] Webhook
- [ ] Frontend
- [ ] Tests
- [ ] Docs

## Out Of Scope

Liste explicitamente o que nao foi alterado.

## Testing

- [ ] Syntax check
- [ ] Unit specs
- [ ] Request specs
- [ ] E2E/staging
- [ ] Stripe test mode

## Security

- [ ] Sem secrets em logs
- [ ] Webhook validado por Stripe SDK
- [ ] Idempotencia verificada
- [ ] Autorizacao verificada

## Deployment Notes

- Migrations
- ENV vars
- Stripe Dashboard config
- Rollback
```

---

## Checklist Local

```bash
cd AB0-1-back
bundle exec rails db:migrate
bundle exec rspec
bundle exec rails runner true
git diff --check
```

Se `rspec` nao estiver instalado localmente, registrar no PR e validar no CI.

---

## Success Criteria

- Hotfix continua verde.
- Banner one-time continua funcionando.
- Billing SaaS usa modulo `Billing`.
- Assinatura recorrente nao depende de `BannerSubscription`.
- Customer Portal funciona em Stripe test mode.
- Security checklist aprovado antes de live mode.
