# Plano de Implementação: Billing SaaS Stripe

**Data:** 2026-05-26  
**Versão:** 1.0

---

## Visão Geral

11 PRs incrementais, cada um deployável de forma independente, sem quebrar o fluxo legado de banner.

---

## PR 1: Discovery, Docs e PRD

**Objetivo:** Documentar o estado atual e o plano antes de qualquer código  
**Branch:** `docs/billing-discovery-prd`

### Arquivos

| Arquivo | Ação |
|---|---|
| `docs/billing/DISCOVERY_BILLING_STRIPE.md` | NOVO |
| `docs/billing/PRD_BILLING_STRIPE.md` | NOVO |
| `docs/billing/BILLING_ARCHITECTURE.md` | NOVO |
| `docs/billing/BILLING_SECURITY_REVIEW.md` | NOVO |
| `docs/billing/BILLING_IMPLEMENTATION_PLAN.md` | NOVO |
| `docs/billing/BILLING_DESIGN_SPEC.md` | NOVO |
| `docs/billing/BILLING_ACTIVE_ADMIN_SPEC.md` | NOVO |
| `docs/billing/BILLING_SLACK_ALERTS_SPEC.md` | NOVO |
| `docs/billing/BILLING_OPERATIONS_RUNBOOK.md` | NOVO |

**Testes:** N/A (apenas docs)  
**Riscos:** Nenhum  
**Critério de aceite:** Todos os 9 docs gerados e revisados  
**Rollback:** Deletar arquivos

---

## PR 2: Schema e Models de Billing

**Objetivo:** Criar tabelas e models sem afetar código existente  
**Branch:** `feat/billing-schema`  
**Dependências:** PR 1 aprovado

### Arquivos

| Arquivo | Ação |
|---|---|
| `db/migrate/YYYYMMDD_create_billing_company_subscriptions.rb` | NOVO |
| `db/migrate/YYYYMMDD_create_billing_stripe_events.rb` | NOVO |
| `db/migrate/YYYYMMDD_create_billing_admin_actions.rb` | NOVO |
| `db/migrate/YYYYMMDD_add_stripe_fields_to_plans.rb` | NOVO |
| `app/models/billing/company_subscription.rb` | NOVO |
| `app/models/billing/stripe_event.rb` | NOVO |
| `app/models/billing/admin_action.rb` | NOVO |
| `app/models/plan.rb` | MODIFICAR — adicionar campos stripe |
| `spec/models/billing/company_subscription_spec.rb` | NOVO |
| `spec/models/billing/stripe_event_spec.rb` | NOVO |

### Migration: `create_billing_company_subscriptions`

```ruby
create_table :billing_company_subscriptions do |t|
  t.references :company, null: false, foreign_key: true
  t.references :plan, null: false, foreign_key: true
  t.string :status, null: false, default: 'incomplete'
  t.string :stripe_customer_id
  t.string :stripe_subscription_id
  t.string :stripe_price_id
  t.datetime :current_period_start
  t.datetime :current_period_end
  t.boolean :cancel_at_period_end, default: false
  t.datetime :canceled_at
  t.datetime :trial_start
  t.datetime :trial_end
  t.text :last_payment_error
  t.datetime :last_payment_error_at
  t.datetime :last_synced_at
  t.boolean :is_enterprise_manual, default: false
  t.text :enterprise_notes
  t.text :admin_notes
  t.timestamps
end

add_index :billing_company_subscriptions, :stripe_customer_id, unique: true
add_index :billing_company_subscriptions, :stripe_subscription_id, unique: true
add_index :billing_company_subscriptions, :status
add_index :billing_company_subscriptions, :company_id, unique: true
```

### Migration: `create_billing_stripe_events`

```ruby
create_table :billing_stripe_events do |t|
  t.string :stripe_event_id, null: false
  t.string :event_type, null: false
  t.string :processing_status, default: 'processing'
  t.text :error_message
  t.jsonb :raw_payload
  t.datetime :processed_at, null: false
  t.timestamps
end

add_index :billing_stripe_events, :stripe_event_id, unique: true
add_index :billing_stripe_events, :event_type
add_index :billing_stripe_events, :processing_status
```

### Migration: `add_stripe_fields_to_plans`

```ruby
add_column :plans, :stripe_product_id, :string
add_column :plans, :stripe_price_id_monthly, :string
add_column :plans, :stripe_price_id_yearly, :string
add_column :plans, :is_public, :boolean, default: true
add_column :plans, :display_order, :integer, default: 0
```

**Testes:**
- Validações de uniqueness de Stripe IDs
- Validações de status
- Scopes: active_saas, past_due, manual_accounts

**Riscos:**
- Migration em banco grande pode ser lenta → usar `disable_ddl_transaction!` + `algorithm: :concurrently` para índices
- Nenhum dado existente é alterado

**Critério de aceite:**
- `rails db:migrate` sem erros
- `rails db:rollback` sem erros
- Specs passando

**Rollback:** `rails db:rollback STEP=4`

---

## PR 3: Billing Plans API

**Objetivo:** Endpoint público de listagem de planos com campos Stripe  
**Branch:** `feat/billing-plans-api`  
**Dependências:** PR 2

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/controllers/api/v1/billing/plans_controller.rb` | NOVO |
| `app/serializers/billing/plan_serializer.rb` | NOVO |
| `config/routes.rb` | MODIFICAR — adicionar namespace billing |
| `spec/requests/api/v1/billing/plans_spec.rb` | NOVO |

### Rota

```ruby
namespace :api do
  namespace :v1 do
    namespace :billing do
      get 'plans', to: 'plans#index'
      # outros endpoints virão nos próximos PRs
    end
  end
end
```

### Serializer

```ruby
class Billing::PlanSerializer < ActiveModel::Serializer
  attributes :id, :name, :description, :price, :display_order,
             :plan_tier, :feature_flags
  # NÃO incluir: stripe_product_id, stripe_price_id_monthly
end
```

**Testes:**
- GET /api/v1/billing/plans retorna apenas planos `is_public: true`
- Retorna campos corretos
- Não expõe Stripe IDs

**Riscos:** Nenhum — endpoint de leitura público, sem escrita

**Critério de aceite:**
- `GET /api/v1/billing/plans` retorna 200 com lista de planos
- Feature flags corretas por plano
- Specs passando

**Rollback:** Reverter rota e deletar controller/serializer

---

## PR 4: Checkout Subscription Service

**Objetivo:** Criar fluxo de checkout para nova assinatura  
**Branch:** `feat/billing-checkout-service`  
**Dependências:** PR 3

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/services/billing/checkout_service.rb` | NOVO |
| `app/services/billing/portal_service.rb` | NOVO |
| `app/services/billing/errors.rb` | NOVO |
| `app/controllers/api/v1/billing/checkout_controller.rb` | NOVO |
| `app/controllers/api/v1/billing/portal_controller.rb` | NOVO |
| `app/controllers/api/v1/billing/subscriptions_controller.rb` | NOVO |
| `app/serializers/billing/subscription_serializer.rb` | NOVO |
| `app/policies/billing_policy.rb` | NOVO |
| `config/routes.rb` | MODIFICAR |
| `spec/services/billing/checkout_service_spec.rb` | NOVO |
| `spec/requests/api/v1/billing/checkout_spec.rb` | NOVO |

**Testes:**
- `CheckoutService` com Stripe mock retorna URL válida
- `CheckoutService` com plano sem `stripe_price_id` lança erro
- POST /api/v1/billing/checkout_sessions requer auth
- POST por usuário sem acesso à empresa retorna 403
- GET /api/v1/billing/current_subscription retorna dados corretos

**Riscos:**
- Stripe mock: usar `stripe-ruby-mock` gem ou VCR cassettes
- Não criar customer duplicado: verificar `stripe_customer_id` existente antes de criar

**Critério de aceite:**
- Checkout criado com sucesso com Stripe mock
- URL de checkout retornada ao frontend
- Nenhuma chamada ao Stripe real em teste

**Rollback:** Desativar rota, deletar services/controllers

---

## PR 5: Webhook SaaS Stripe + Idempotência

**Objetivo:** Handler de webhook separado do legado com idempotência completa  
**Branch:** `feat/billing-webhook-handler`  
**Dependências:** PR 4

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/services/billing/stripe_webhook_handler.rb` | NOVO |
| `app/services/billing/subscription_sync_service.rb` | NOVO |
| `app/controllers/api/v1/billing/webhooks_controller.rb` | NOVO |
| `config/routes.rb` | MODIFICAR — `POST /api/v1/billing/webhooks/stripe` |
| `config/initializers/stripe.rb` | MODIFICAR — validação de billing secret |
| `spec/services/billing/stripe_webhook_handler_spec.rb` | NOVO |
| `spec/services/billing/subscription_sync_service_spec.rb` | NOVO |

**Testes:**
- Assinatura inválida → retorna 400
- `event.id` duplicado → 200 OK sem processar
- `customer.subscription.created` → cria/atualiza CompanySubscription
- `customer.subscription.deleted` → status = 'canceled', plan = Free
- `invoice.payment_failed` → status = 'past_due', last_payment_error preenchido
- Eventos fora de ordem → não sobrescrever com dados antigos

**Riscos:**
- `STRIPE_BILLING_WEBHOOK_SECRET` não configurado em dev: usar Stripe CLI `stripe listen`
- Separação de rota: garantir que `/api/v1/payments/webhooks/stripe` (legado) NÃO é afetado

**Critério de aceite:**
- Webhook com assinatura válida processado com sucesso
- Webhook duplicado ignorado com 200
- Status de CompanySubscription atualizado corretamente
- Specs com 100% dos cenários cobertos

**Rollback:** Desativar rota, status quo do banco reverte por PaperTrail

---

## PR 6: Customer Portal

**Objetivo:** Permitir que empresas gerenciem assinatura via Stripe Portal  
**Branch:** `feat/billing-customer-portal`  
**Dependências:** PR 5

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/services/billing/portal_service.rb` | (já criado no PR4, finalizar) |
| `app/controllers/api/v1/billing/portal_controller.rb` | NOVO (ou finalizar) |
| `spec/requests/api/v1/billing/portal_spec.rb` | NOVO |

**Testes:**
- POST /api/v1/billing/customer_portal retorna URL do portal
- Empresa sem stripe_customer_id → erro tratado
- Usuário sem acesso → 403

**Riscos:** Nenhum alto — Stripe hosted, sem dados locais

**Critério de aceite:**
- URL do Customer Portal retornada com sucesso (mock)
- Redirecionamento correto de retorno para dashboard

**Rollback:** Desativar rota

---

## PR 7: ActiveAdmin para Planos e Assinaturas

**Objetivo:** Painel de billing operacional no ActiveAdmin  
**Branch:** `feat/billing-active-admin`  
**Dependências:** PR 5

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/admin/billing_company_subscriptions.rb` | NOVO |
| `app/admin/plans.rb` | MODIFICAR — adicionar campos stripe |
| `app/models/admin_user.rb` | MODIFICAR — adicionar billing_role |
| `db/migrate/YYYYMMDD_add_billing_role_to_admin_users.rb` | NOVO |
| `app/services/billing/admin_subscription_service.rb` | NOVO |
| `app/models/billing/admin_action.rb` | NOVO (ou mover do PR2) |
| `spec/admin/billing_company_subscriptions_spec.rb` | NOVO |
| `spec/services/billing/admin_subscription_service_spec.rb` | NOVO |

**Testes:**
- Lista de assinaturas filtrada por status
- Ação de sync requer justification
- Ação de downgrade requer billing_finance role
- Audit action criada após cada ação manual

**Riscos:**
- Ações destrutivas sem confirmação UI → exigir params[:justification]
- Acidental downgrade de cliente Enterprise → validar role antes

**Critério de aceite:**
- Admin consegue ver assinaturas com filtros funcionais
- Ações de sync/downgrade/enterprise registram audit action
- Role de admin validado em cada ação

**Rollback:** Desativar resource do admin

---

## PR 8: Slack Admin Notifications

**Objetivo:** Alertas de billing no canal `#billing-alerts`  
**Branch:** `feat/billing-slack-notifications`  
**Dependências:** PR 5

### Arquivos

| Arquivo | Ação |
|---|---|
| `app/services/billing/slack_notifier.rb` | NOVO |
| `app/services/slack_notification_service.rb` | MODIFICAR — adicionar channel `:billing` |
| `spec/services/billing/slack_notifier_spec.rb` | NOVO |

### ENV Vars Novas

```
SLACK_BILLING_WEBHOOK_URL  → novo canal #billing-alerts
```

**Testes:**
- Nova assinatura Pro → mensagem verde enviada
- Falha de pagamento → mensagem vermelha SÍNCRONA
- Webhook inválido → alerta em #alertas
- Slack offline → não quebra o fluxo principal (rescue StandardError)

**Riscos:**
- Thread.new para Slack pode perder notificações em crash → para billing crítico usar synchronous: true

**Critério de aceite:**
- Notificação enviada para canal correto por tipo de evento
- Falhas do Slack logadas sem quebrar o fluxo

**Rollback:** Desativar chamadas ao SlackNotifier (feature flag ENV)

---

## PR 9: Frontend `/pricing` Integrado

**Objetivo:** Página de pricing com dados reais da API  
**Branch:** `feat/billing-pricing-page`  
**Dependências:** PR 3

### Arquivos

| Arquivo | Ação |
|---|---|
| `AB0-1-front/app/pricing/page.tsx` | MODIFICAR |
| `AB0-1-front/components/pricing/PricingPage.tsx` | MODIFICAR — conectar à API |
| `AB0-1-front/components/pricing/PlanCard.tsx` | NOVO |
| `AB0-1-front/components/pricing/PricingFaq.tsx` | NOVO |
| `AB0-1-front/components/pricing/PricingFeatureTable.tsx` | NOVO |
| `AB0-1-front/lib/api/billing.ts` | NOVO — funções de API de billing |
| `AB0-1-front/__tests__/pricing/PricingPage.test.tsx` | NOVO |

**Testes:**
- Renderiza 3 cards de plano corretamente
- CTA "Assinar Pro" redireciona para /login se não autenticado
- CTA "Grátis" redireciona para /register
- Feature table mostra corretamente ✅/❌ por plano

**Riscos:**
- API retornando planos sem stripe_price_id → esconder CTA ou mostrar "Em breve"
- SEO: garantir SSR para a página de pricing

**Critério de aceite:**
- `/pricing` carrega planos da API em < 500ms
- Cards mobile-first responsivos
- Lighthouse score > 90

**Rollback:** Reverter para versão estática (manter fallback mock)

---

## PR 10: Dashboard "Plano e Cobrança"

**Objetivo:** Aba autenticada de billing no dashboard da empresa  
**Branch:** `feat/billing-dashboard`  
**Dependências:** PRs 4, 5, 6

### Arquivos

| Arquivo | Ação |
|---|---|
| `AB0-1-front/app/company-dashboard/billing/page.tsx` | NOVO |
| `AB0-1-front/components/billing/CurrentPlanCard.tsx` | NOVO |
| `AB0-1-front/components/billing/BillingStatusBanner.tsx` | NOVO |
| `AB0-1-front/components/billing/UpgradeButton.tsx` | NOVO |
| `AB0-1-front/components/billing/ManageSubscriptionButton.tsx` | NOVO |
| `AB0-1-front/hooks/useBillingSubscription.ts` | NOVO |
| `AB0-1-front/__tests__/billing/BillingDashboard.test.tsx` | NOVO |

**Testes:**
- Estado `active` mostra próxima cobrança e botão "Gerenciar"
- Estado `past_due` mostra banner vermelho de pagamento pendente
- Estado `canceled` mostra data de expiração e botão de reativação
- Estado Free mostra CTA de upgrade

**Riscos:**
- CORS para chamadas ao backend de billing
- Cache de subscription stale → invalidar ao retornar do Stripe

**Critério de aceite:**
- Dashboard mostra estado correto para cada status de assinatura
- Botão "Gerenciar" redireciona para Customer Portal corretamente
- Specs cobrindo todos os estados

**Rollback:** Remover rota de billing no dashboard

---

## PR 11: Testes E2E, Segurança e Rollout

**Objetivo:** Validação final, testes de segurança e configuração de rollout  
**Branch:** `feat/billing-e2e-rollout`  
**Dependências:** Todos os PRs anteriores

### Arquivos

| Arquivo | Ação |
|---|---|
| `spec/features/billing/checkout_flow_spec.rb` | NOVO — E2E |
| `spec/features/billing/webhook_security_spec.rb` | NOVO |
| `spec/features/billing/admin_billing_spec.rb` | NOVO |
| `config/initializers/stripe.rb` | MODIFICAR — validações de boot |
| `config/initializers/rack_attack.rb` | MODIFICAR — rate limiting billing |
| `docs/billing/BILLING_OPERATIONS_RUNBOOK.md` | REVISAR E FINALIZAR |

### Testes E2E

- Fluxo completo: Free → checkout → simulação de webhook → dashboard mostra Pro
- Webhook com assinatura inválida retorna 400
- Admin downgrade registra audit e notifica Slack
- Empresa em `past_due` não consegue acessar features Pro (feature gate)

### Checklist de Segurança

- [ ] Penetration test básico nos endpoints de billing (usar ferramentas como `zaproxy`)
- [ ] Review de todos os logs em produção para PII
- [ ] Verificar que Stripe IDs não aparecem no frontend
- [ ] Testar cenários de replay de webhook

### Critério de Aceite

- Todos os testes E2E passando
- Zero PII nos logs
- Checklist de segurança 100% concluído
- Runbook aprovado pelo time de operações

**Rollback:** Feature flags para desabilitar billing completamente sem deploy

---

## Cronograma Estimado

| PR | Esforço Estimado | Dependências |
|---|---|---|
| PR 1 | 1 dia | - |
| PR 2 | 2 dias | PR 1 |
| PR 3 | 1 dia | PR 2 |
| PR 4 | 3 dias | PR 3 |
| PR 5 | 3 dias | PR 4 |
| PR 6 | 1 dia | PR 5 |
| PR 7 | 3 dias | PR 5 |
| PR 8 | 1 dia | PR 5 |
| PR 9 | 3 dias | PR 3 |
| PR 10 | 3 dias | PRs 4,5,6 |
| PR 11 | 2 dias | Todos |
| **Total** | **~23 dias úteis** | |

---

## Decisões Bloqueantes Antes de Começar

| # | Decisão | Quem Decide |
|---|---|---|
| DP-01 | Valor do plano Pro (R$?) | Product |
| DP-03 | Enterprise: self-serve ou manual? | Comercial |
| DP-04 | Billing anual na v1? | Product |
| DP-09 | MercadoPago para subscriptions? | Tech/Product |
| DP-10 | Renomear SubscriptionPlan? | Tech |
