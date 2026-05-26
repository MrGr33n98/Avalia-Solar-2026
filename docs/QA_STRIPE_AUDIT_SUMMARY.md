# Sumario Executivo - Stripe Subscriptions

## Resultado Atual

**Data base:** 26 de maio de 2026
**Projeto:** Avalia Solar, Rails 7.0.8 API + React/Next.js
**Status:** hotfix critico aplicado; billing SaaS ainda pendente.
**Score original:** 17.5/100, calculado antes do hotfix.

O risco imediato de webhook Stripe legado foi reduzido. A implementacao de assinaturas SaaS ainda nao esta pronta porque faltam schema, endpoints, Customer Portal, checkout recorrente e testes E2E.

---

## Estado Por Area

| Area | Estado pos-hotfix | Observacao |
| --- | --- | --- |
| Webhook Stripe legado | Corrigido | Usa `Stripe-Signature` e SDK oficial |
| `Plan#raw_feature_flags` | Corrigido | Metodo existe no model `Plan` |
| Checkout de banner | Mantido | Continua `mode: 'payment'` por ser compra avulsa |
| Schema SaaS | Pendente | Falta `company_subscriptions` e campos Stripe em `plans` |
| Billing API | Pendente | Faltam endpoints `/api/v1/billing/*` |
| Frontend checkout | Pendente | `/pricing` ainda nao abre checkout recorrente real |
| Security/E2E | Pendente | Falta validacao completa de assinatura SaaS, idempotencia e autorizacao |

---

## Decisoes Fixadas

- Nao alterar `Payment::CheckoutService#mode: 'payment'`.
- Criar assinatura recorrente em um novo `Billing::CheckoutService`.
- Manter webhook legado apontando para `BannerSubscription` ate o billing SaaS existir.
- Separar o webhook SaaS em endpoint/handler proprio na proxima fase.

---

## Proximas Prioridades

### 1. Validacao Do Hotfix

- Rodar specs focadas em webhook e `Plan`.
- Testar evento `checkout.session.completed` de banner em staging.
- Confirmar que assinatura Stripe invalida retorna `401`.
- Confirmar que secret ausente retorna erro de configuracao.

### 2. Schema SaaS

- Adicionar identificadores Stripe e metadados publicos em `plans`.
- Criar `company_subscriptions`.
- Criar model com associacoes, status e indices.
- Criar seeds de `free`, `pro` e `enterprise`.

### 3. Billing API

- `GET /api/v1/billing/plans`.
- `POST /api/v1/billing/checkout_sessions`.
- `POST /api/v1/billing/customer_portal`.
- `POST /api/v1/billing/webhooks/stripe`.
- Autorizacao por usuario autenticado e empresa proprietaria.

### 4. Frontend E QA

- Conectar `/pricing` ao checkout recorrente.
- Criar area de plano e cobranca no dashboard.
- Testar Customer Portal.
- Rodar E2E com Stripe test cards.

---

## Riscos Ainda Abertos

- Sem tabela de assinatura SaaS, nao ha fonte canonica de plano pago por empresa.
- Sem idempotencia, a proxima fase de checkout pode duplicar sessoes.
- Sem endpoint billing, o frontend ainda nao consegue assinar plano.
- Sem security review, nao liberar cobranca real.

---

## Recomendacao

Liberar o hotfix apenas se CI/staging passarem. Para cobranca recorrente real, iniciar uma fase separada de billing SaaS, sem reaproveitar o service de checkout de banner.
