# Arquitetura Técnica: Billing SaaS com Stripe

**Data:** 2026-05-26  
**Versão:** 1.0  
**Status:** Draft — aguardando revisão técnica

---

## 1. Princípios de Design

1. **Separação total do legado:** Novo módulo `Billing::` completamente separado de `Payment::` (banner)
2. **Idempotência first:** Todo webhook processado é registrado antes de qualquer ação
3. **Stripe como fonte da verdade:** Banco local é sincronizado do Stripe, não o contrário
4. **Falha segura:** Em caso de dúvida, não bloquear acesso já concedido (evitar downtime de cliente)
5. **Auditoria completa:** Todo estado financeiro tem trail imutável

---

## 2. Backend — Módulo `Billing`

### 2.1 Novo Modelo: `CompanySubscription`

```ruby
# app/models/billing/company_subscription.rb
# ou: app/models/company_subscription.rb no namespace Billing

class Billing::CompanySubscription < ApplicationRecord
  self.table_name = 'billing_company_subscriptions'

  belongs_to :company
  belongs_to :plan

  has_paper_trail # Auditoria completa de mudanças

  STATUSES = %w[
    trialing
    active
    past_due
    canceled
    unpaid
    incomplete
    incomplete_expired
    manual
    paused
  ].freeze

  validates :status, inclusion: { in: STATUSES }
  validates :stripe_subscription_id, uniqueness: true, allow_nil: true
  validates :stripe_customer_id, presence: true, unless: :manual?

  # Scopes operacionais
  scope :active_saas,     -> { where(status: %w[active trialing]) }
  scope :past_due,        -> { where(status: 'past_due') }
  scope :manual_accounts, -> { where(status: 'manual') }
  scope :canceled,        -> { where(status: 'canceled') }

  def manual?
    status == 'manual'
  end

  def active_or_trialing?
    status.in?(%w[active trialing])
  end

  def cancel_at_period_end?
    cancel_at_period_end == true
  end
end
```

**Campos da tabela `billing_company_subscriptions`:**

```sql
-- Migration schema (não implementar ainda)
company_id                    integer  NOT NULL FK companies
plan_id                       integer  NOT NULL FK plans
status                        varchar  NOT NULL DEFAULT 'incomplete'
stripe_customer_id            varchar  UNIQUE
stripe_subscription_id        varchar  UNIQUE
stripe_price_id               varchar
current_period_start          timestamp
current_period_end            timestamp
cancel_at_period_end          boolean  DEFAULT false
canceled_at                   timestamp
trial_start                   timestamp
trial_end                     timestamp
last_payment_error            text
last_payment_error_at         timestamp
last_synced_at                timestamp
is_enterprise_manual          boolean  DEFAULT false
enterprise_notes              text
admin_notes                   text
created_at                    timestamp
updated_at                    timestamp
```

### 2.2 Campos Stripe nos `plans`

```sql
-- Migration para adicionar a tabela existente plans
stripe_product_id             varchar  -- ex: prod_XXXX
stripe_price_id_monthly       varchar  -- ex: price_XXXX (mensal)
stripe_price_id_yearly        varchar  -- ex: price_XXXX (anual, futuro)
is_public                     boolean  DEFAULT true  -- aparece no /pricing?
display_order                 integer  -- ordem nos cards
```

### 2.3 Tabela de Idempotência: `billing_stripe_events`

```sql
-- CRÍTICO: deve existir antes do primeiro webhook de billing
stripe_event_id               varchar  NOT NULL UNIQUE
event_type                    varchar  NOT NULL
processed_at                  timestamp NOT NULL
processing_status             varchar  -- success, failed, skipped
error_message                 text
raw_payload                   jsonb    -- payload completo (sem dados de cartão)
```

### 2.4 Tabela de Auditoria de Ações Admin: `billing_admin_actions`

```sql
admin_user_id                 integer  NOT NULL FK admin_users
company_subscription_id       integer  FK billing_company_subscriptions
company_id                    integer  FK companies
action_type                   varchar  NOT NULL  -- sync, downgrade, enterprise_mark, etc.
justification                 text     NOT NULL
metadata                      jsonb    -- dados extras da ação
performed_at                  timestamp NOT NULL
ip_address                    varchar
```

---

## 3. Serviços do Módulo Billing

### 3.1 `Billing::CheckoutService`

**Responsabilidade:** Criar Stripe Checkout Session para nova assinatura

```ruby
# app/services/billing/checkout_service.rb
module Billing
  class CheckoutService
    def initialize(company:, plan:, current_user:)
      @company = company
      @plan    = plan
      @user    = current_user
    end

    def call
      ensure_stripe_customer!
      create_checkout_session
    end

    private

    def ensure_stripe_customer!
      # Cria ou reutiliza stripe_customer_id da CompanySubscription
    end

    def create_checkout_session
      Stripe::Checkout::Session.create(
        customer: stripe_customer_id,
        mode: 'subscription',
        line_items: [{ price: @plan.stripe_price_id_monthly, quantity: 1 }],
        subscription_data: { metadata: { company_id: @company.id } },
        success_url: "#{ENV['FRONTEND_URL']}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}&status=success",
        cancel_url: "#{ENV['FRONTEND_URL']}/dashboard/billing?status=cancelled",
        client_reference_id: @company.id.to_s,
        metadata: { company_id: @company.id, plan_id: @plan.id, initiated_by: @user.id }
      )
    end
  end
end
```

### 3.2 `Billing::PortalService`

**Responsabilidade:** Criar Stripe Customer Portal session

```ruby
module Billing
  class PortalService
    def initialize(company:)
      @company = company
    end

    def call
      subscription = Billing::CompanySubscription.find_by!(company: @company)
      raise Billing::Errors::NoSubscription unless subscription.stripe_customer_id

      Stripe::BillingPortal::Session.create(
        customer: subscription.stripe_customer_id,
        return_url: "#{ENV['FRONTEND_URL']}/dashboard/billing"
      )
    end
  end
end
```

### 3.3 `Billing::StripeWebhookHandler`

**Responsabilidade:** Processar eventos do webhook SaaS (SEPARADO do handler de banner)

```ruby
module Billing
  class StripeWebhookHandler
    HANDLED_EVENTS = %w[
      customer.subscription.created
      customer.subscription.updated
      customer.subscription.deleted
      invoice.payment_succeeded
      invoice.payment_failed
      customer.subscription.trial_will_end
    ].freeze

    def initialize(payload:, signature:)
      @payload   = payload
      @signature = signature
    end

    def call
      event = verify_and_parse!
      return :duplicate if already_processed?(event.id)

      record_event!(event)
      dispatch(event)
    end

    private

    def verify_and_parse!
      Stripe::Webhook.construct_event(
        @payload,
        @signature,
        ENV.fetch('STRIPE_BILLING_WEBHOOK_SECRET')
      )
    rescue Stripe::SignatureVerificationError => e
      Billing::SlackNotifier.notify_invalid_webhook(error: e.message)
      raise Billing::Errors::InvalidWebhookSignature, e.message
    end

    def already_processed?(event_id)
      Billing::StripeEvent.exists?(stripe_event_id: event_id)
    end

    def record_event!(event)
      Billing::StripeEvent.create!(
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: Time.current,
        processing_status: 'processing',
        raw_payload: event.data.object.to_h
      )
    end

    def dispatch(event)
      case event.type
      when 'customer.subscription.created', 'customer.subscription.updated'
        Billing::SubscriptionSyncService.new(event.data.object).call
      when 'customer.subscription.deleted'
        Billing::SubscriptionSyncService.new(event.data.object, deleted: true).call
      when 'invoice.payment_succeeded'
        handle_payment_succeeded(event.data.object)
      when 'invoice.payment_failed'
        handle_payment_failed(event.data.object)
      end
    end
  end
end
```

### 3.4 `Billing::SubscriptionSyncService`

**Responsabilidade:** Sincronizar estado do Stripe com banco local

```ruby
module Billing
  class SubscriptionSyncService
    def initialize(stripe_subscription, deleted: false)
      @stripe_sub = stripe_subscription
      @deleted    = deleted
    end

    def call
      company_sub = find_or_initialize_subscription
      update_subscription!(company_sub)
      update_company_plan!(company_sub)
      notify_if_needed(company_sub)
    end

    private

    def find_or_initialize_subscription
      Billing::CompanySubscription.find_or_initialize_by(
        stripe_subscription_id: @stripe_sub.id
      )
    end

    def update_subscription!(sub)
      sub.update!(
        stripe_customer_id:    @stripe_sub.customer,
        stripe_price_id:       @stripe_sub.items.data.first&.price&.id,
        status:                @deleted ? 'canceled' : @stripe_sub.status,
        current_period_start:  Time.at(@stripe_sub.current_period_start),
        current_period_end:    Time.at(@stripe_sub.current_period_end),
        cancel_at_period_end:  @stripe_sub.cancel_at_period_end,
        trial_start:           @stripe_sub.trial_start&.then { |t| Time.at(t) },
        trial_end:             @stripe_sub.trial_end&.then { |t| Time.at(t) },
        last_synced_at:        Time.current
      )
    end

    def update_company_plan!(sub)
      # Resolução do plan pelo stripe_price_id
      plan = Plan.find_by(stripe_price_id_monthly: sub.stripe_price_id)
      fallback = Plan.find_by(name: 'Free')

      target_plan = if sub.active_or_trialing?
                      plan || sub.plan
                    else
                      fallback
                    end

      sub.company.update!(plan: target_plan)
    end
  end
end
```

### 3.5 `Billing::AdminSubscriptionService`

**Responsabilidade:** Ações manuais seguras do admin com auditoria

```ruby
module Billing
  class AdminSubscriptionService
    def initialize(company:, admin_user:, justification:)
      @company       = company
      @admin         = admin_user
      @justification = justification
    end

    def mark_as_enterprise!(notes: nil)
      with_audit('mark_enterprise') do
        sub = find_or_create_subscription
        sub.update!(status: 'manual', is_enterprise_manual: true, enterprise_notes: notes)
        @company.update!(plan: Plan.find_by!(name: 'Enterprise'))
        Billing::SlackNotifier.notify_enterprise_manual(company: @company, admin: @admin)
      end
    end

    def force_downgrade_to_free!(reason:)
      with_audit('force_downgrade', metadata: { reason: reason }) do
        sub = find_subscription!
        # Cancela no Stripe se tiver subscription ativa
        if sub.stripe_subscription_id.present?
          Stripe::Subscription.cancel(sub.stripe_subscription_id)
        end
        sub.update!(status: 'canceled', canceled_at: Time.current)
        @company.update!(plan: Plan.find_by!(name: 'Free'))
        Billing::SlackNotifier.notify_force_downgrade(company: @company, admin: @admin, reason: reason)
      end
    end

    def sync_with_stripe!
      with_audit('sync_stripe') do
        sub = find_subscription!
        stripe_sub = Stripe::Subscription.retrieve(sub.stripe_subscription_id)
        Billing::SubscriptionSyncService.new(stripe_sub).call
      end
    end

    def cancel_at_period_end!
      with_audit('cancel_at_period_end') do
        sub = find_subscription!
        Stripe::Subscription.update(sub.stripe_subscription_id, cancel_at_period_end: true)
        sub.update!(cancel_at_period_end: true)
        Billing::SlackNotifier.notify_subscription_canceled(company: @company, admin: @admin)
      end
    end

    private

    def with_audit(action_type, metadata: {})
      result = yield
      Billing::AdminAction.create!(
        admin_user: @admin,
        company: @company,
        action_type: action_type,
        justification: @justification,
        metadata: metadata,
        performed_at: Time.current
      )
      result
    end
  end
end
```

### 3.6 `Billing::SlackNotifier`

**Responsabilidade:** Enviar notificações de billing para Slack

```ruby
module Billing
  class SlackNotifier
    CHANNEL = :billing

    def self.notify_new_subscription(company:, plan:)
      SlackNotificationService.notify(
        "💳 *Nova Assinatura #{plan.name}*",
        [{
          color: '#2eb886',
          fields: [
            { title: 'Empresa', value: company.name, short: true },
            { title: 'Plano', value: plan.name, short: true },
            { title: 'Segmento', value: company.segment, short: true },
            { title: 'Cidade', value: "#{company.city}/#{company.state}", short: true }
          ],
          footer: "Company ID: #{company.id}"
        }],
        channel: CHANNEL
      )
    end

    def self.notify_payment_failed(company:, reason:, amount_cents: nil)
      value_str = amount_cents ? "R$ #{(amount_cents / 100.0).round(2)}" : 'N/A'
      SlackNotificationService.notify(
        "🚨 *Falha de Pagamento*",
        [{
          color: '#e74c3c',
          fields: [
            { title: 'Empresa', value: company.name, short: true },
            { title: 'Motivo', value: reason, short: true },
            { title: 'Valor', value: value_str, short: true }
          ],
          footer: "Company ID: #{company.id} | #{Time.current.strftime('%d/%m/%Y %H:%M')}"
        }],
        channel: CHANNEL,
        synchronous: true  # Crítico: não pode ser Thread
      )
    end

    def self.notify_invalid_webhook(error:)
      SlackNotificationService.notify(
        "⚠️ *Webhook Stripe Inválido — Billing*",
        [{
          color: '#ff0000',
          fields: [{ title: 'Erro', value: error, short: false }],
          footer: "Verificar STRIPE_BILLING_WEBHOOK_SECRET"
        }],
        channel: :alertas,
        synchronous: true
      )
    end
  end
end
```

---

## 4. Endpoints de API

### 4.1 Rota Pública

```ruby
# config/routes.rb — dentro do namespace :api, :v1
namespace :billing do
  get  'plans',                to: 'plans#index'        # público
  get  'current_subscription', to: 'subscriptions#show' # auth
  post 'checkout_sessions',    to: 'checkout#create'    # auth
  post 'customer_portal',      to: 'portal#create'      # auth
  post 'webhooks/stripe',      to: 'webhooks#stripe'    # sem auth, validado por assinatura
end
```

**Rota do webhook:** `POST /api/v1/billing/webhooks/stripe`  
**Separação:** DIFERENTE de `POST /api/v1/payments/webhooks/stripe` (legado de banner)

### 4.2 Controllers

```ruby
# app/controllers/api/v1/billing/plans_controller.rb
module Api::V1::Billing
  class PlansController < ApplicationController
    skip_before_action :authenticate_user! # público

    def index
      plans = Plan.where(is_public: true).order(:display_order)
      render json: plans, each_serializer: Billing::PlanSerializer
    end
  end
end

# app/controllers/api/v1/billing/subscriptions_controller.rb
module Api::V1::Billing
  class SubscriptionsController < ApplicationController
    before_action :authenticate_user!
    before_action :require_active_company!

    def show
      subscription = Billing::CompanySubscription.find_by(company: current_company)
      render json: subscription, serializer: Billing::SubscriptionSerializer
    end
  end
end

# app/controllers/api/v1/billing/webhooks_controller.rb
module Api::V1::Billing
  class WebhooksController < ApplicationController
    skip_before_action :authenticate_user!
    skip_before_action :verify_authenticity_token

    def stripe
      payload   = request.body.read
      signature = request.env['HTTP_STRIPE_SIGNATURE']

      result = Billing::StripeWebhookHandler.new(
        payload: payload,
        signature: signature
      ).call

      head :ok
    rescue Billing::Errors::InvalidWebhookSignature
      head :bad_request
    rescue => e
      Rails.logger.error("[Billing::Webhook] #{e.class}: #{e.message}")
      Sentry.capture_exception(e)
      head :unprocessable_entity
    end
  end
end
```

---

## 5. ActiveAdmin — Planejamento

### 5.1 Resource: `Billing::CompanySubscription`

```ruby
# app/admin/billing_company_subscriptions.rb
ActiveAdmin.register Billing::CompanySubscription do
  menu label: 'Billing — Assinaturas', priority: 20, parent: 'Billing'

  # Filtros
  filter :status, as: :select, collection: Billing::CompanySubscription::STATUSES
  filter :company_name_cont, label: 'Empresa'
  filter :plan
  filter :is_enterprise_manual
  filter :cancel_at_period_end
  filter :current_period_end
  filter :created_at

  # Scopes rápidos
  scope :all, default: true
  scope('Ativas')    { |s| s.active_saas }
  scope('Past Due')  { |s| s.past_due }
  scope('Manual')    { |s| s.manual_accounts }
  scope('Canceladas'){ |s| s.canceled }

  index do
    # empresa, plano, status, stripe_customer_id, stripe_subscription_id
    # período atual, trial, cancel_at_period_end, last_payment_error, last_synced_at
    # ações
  end

  show do
    # detalhes completos
    # painel de ações admin
    # histórico de ações
    # link Stripe Dashboard
  end

  # Ações individuais (member actions)
  member_action :sync_stripe, method: :post do
    # Billing::AdminSubscriptionService.new(...).sync_with_stripe!
  end

  member_action :mark_enterprise, method: :post do
    # Billing::AdminSubscriptionService.new(...).mark_as_enterprise!
  end

  member_action :force_downgrade, method: :post do
    # Billing::AdminSubscriptionService.new(...).force_downgrade_to_free!
  end

  member_action :cancel_at_period_end, method: :post do
    # Billing::AdminSubscriptionService.new(...).cancel_at_period_end!
  end
end
```

---

## 6. Autorização

### 6.1 `BillingPolicy` (Pundit)

```ruby
# app/policies/billing_policy.rb
class BillingPolicy < ApplicationPolicy
  def checkout?
    # Usuário autenticado com acesso à empresa
    user.present? && user_has_company_access?
  end

  def manage?
    # Dono da empresa ou admin
    company_owner? || user.admin?
  end

  private

  def user_has_company_access?
    company = record.try(:company) || record
    CompanyMember.exists?(user: user, company: company, status: 'active')
  end
end
```

### 6.2 Roles de Admin para Billing

```ruby
# Proposta de extension no AdminUser
# Adicionar campo: billing_role (string)
# Valores: nil (leitura), 'support', 'finance', 'super_admin'

class AdminUser < ApplicationRecord
  BILLING_ROLES = %w[support finance super_admin].freeze

  def billing_support?
    billing_role.in?(%w[support finance super_admin])
  end

  def billing_finance?
    billing_role.in?(%w[finance super_admin])
  end

  def billing_super_admin?
    billing_role == 'super_admin'
  end
end
```

---

## 7. Logs Estruturados

Todos os eventos de billing devem logar em formato JSON via Lograge:

```json
{
  "event": "billing.subscription.activated",
  "company_id": 123,
  "plan_name": "Pro",
  "stripe_subscription_id": "sub_XXXX",
  "stripe_event_id": "evt_XXXX",
  "processing_time_ms": 45,
  "timestamp": "2026-05-26T15:00:00-03:00"
}
```

---

## 8. Idempotência e Reprocessamento

```ruby
# Fluxo de idempotência para todo webhook SaaS:
# 1. Receber payload + signature
# 2. Verificar signature (STRIPE_BILLING_WEBHOOK_SECRET)
# 3. Verificar se event.id já existe em billing_stripe_events
#    → Se sim: retornar 200 OK sem processar (duplicate)
# 4. Inserir event.id com status 'processing'
# 5. Processar evento em transaction
# 6. Atualizar status para 'success' ou 'failed'

# Reprocessamento manual (admin):
# Admin clica "Reprocessar último webhook"
# → Busca último billing_stripe_event com status 'failed'
# → Remove registro de idempotência
# → Reenvia para processamento
```

---

## 9. Estratégia de Rollback

| Cenário | Estratégia |
|---|---|
| Bug no sync de assinatura | PaperTrail permite reverter estado anterior |
| Webhook processado incorretamente | Reprocessar via admin após fix do bug |
| Migration com problema | Rollback via `db:rollback` — campos adicionados (não removidos) |
| Downgrade indevido | Admin reverter para plan anterior via `AdminSubscriptionService` |
| Stripe em downtime | Banco local mantém último estado conhecido; sync rodará quando Stripe voltar |

---

## 10. Ambientes

```bash
# Development
STRIPE_BILLING_WEBHOOK_SECRET=whsec_test_XXXX  # Stripe CLI test
STRIPE_SECRET_KEY=sk_test_XXXX

# Staging
STRIPE_BILLING_WEBHOOK_SECRET=whsec_staging_XXXX
STRIPE_SECRET_KEY=sk_test_XXXX  # sempre test em staging

# Production
STRIPE_BILLING_WEBHOOK_SECRET=whsec_live_XXXX
STRIPE_SECRET_KEY=sk_live_XXXX
```

**Validação no boot:**
```ruby
# config/initializers/stripe.rb
if Rails.env.production?
  raise "STRIPE_SECRET_KEY deve ser live em produção" unless ENV['STRIPE_SECRET_KEY']&.start_with?('sk_live_')
  raise "STRIPE_BILLING_WEBHOOK_SECRET é obrigatório" if ENV['STRIPE_BILLING_WEBHOOK_SECRET'].blank?
end
```
