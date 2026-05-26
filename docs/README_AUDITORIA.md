# Auditoria Stripe Subscriptions - Indice

## Visao Geral

Esta pasta consolida a auditoria de Stripe Subscriptions do Avalia Solar.

**Projeto:** Rails 7.0.8 API + React/Next.js
**Data base:** 26 de maio de 2026
**Status pos-hotfix:** parcial. O hotfix de webhook Stripe e `Plan#raw_feature_flags` ja foi aplicado; billing SaaS ainda nao existe em producao.
**Score original:** 17.5/100, referente ao estado pre-hotfix.

Importante: o checkout legado em `Payment::CheckoutService` e uma compra avulsa de banner e deve continuar com `mode: 'payment'`. O checkout recorrente deve ser criado em um novo modulo `Billing`.

---

## Documentos

| Documento | Papel | Status |
| --- | --- | --- |
| `QA_STRIPE_AUDIT_SUMMARY.md` | Sumario executivo e plano de acao atualizado | Pos-hotfix |
| `STRIPE_SUBSCRIPTIONS_AUDIT.md` | Auditoria tecnica canonica | Pos-hotfix |
| `BROKEN_CODE_VS_FIXES.md` | Bugs, correcoes feitas e proximos fixes | Pos-hotfix |
| `SECURITY_TESTING_CHECKLIST.md` | Checklist de seguranca para billing SaaS | Atualizado |
| `PR_TEMPLATE_AND_GUIDE.md` | Guia de PRs para continuar a implementacao | Pos-hotfix |
| `AUDIT_STRIPE_SUBSCRIPTIONS.md` | Redirect para a auditoria canonica | Redirect |

---

## Ja Corrigido No Hotfix

- Webhook Stripe usa `Stripe-Signature`.
- Validacao Stripe usa `Stripe::Webhook.construct_event`.
- Verificacao manual Stripe foi removida de `Webhooks::SecurityService`.
- HMAC continua ativo para `mock`, `mercadopago` e `pagarme`.
- `Plan#raw_feature_flags` foi implementado com fallback seguro para `features`.
- `BannerSubscription` continua sendo o alvo do webhook Stripe legado.

---

## Ainda Pendente Para Billing SaaS

1. Criar campos Stripe em `plans`: `slug`, `stripe_product_id`, `stripe_monthly_price_id`, `stripe_yearly_price_id`, `active`, `public`, `sort_order`.
2. Criar `company_subscriptions` e model `CompanySubscription`.
3. Criar endpoints `/api/v1/billing/plans`, `/checkout_sessions`, `/customer_portal` e `/webhooks/stripe`.
4. Criar `Billing::CheckoutService` com `mode: 'subscription'`.
5. Criar Customer Portal e dashboard de plano/cobranca.
6. Criar testes de webhook, idempotencia, autorizacao e fluxo E2E.
7. Configurar webhook SaaS no Stripe Dashboard.

---

## Ordem Recomendada

1. Validar o hotfix em CI/staging.
2. Implementar schema SaaS e seeds dos planos.
3. Implementar backend Billing separado do fluxo de banner.
4. Integrar frontend `/pricing` e dashboard.
5. Fazer security review e E2E com Stripe test mode.

---

## Regra De Ouro

Nao transforme `Payment::CheckoutService` em assinatura recorrente. Ele pertence ao fluxo legado de banners. O SaaS precisa nascer em um modulo `Billing` separado para evitar mistura entre compra avulsa e assinatura da empresa.
