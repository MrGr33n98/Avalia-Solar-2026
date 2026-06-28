# frozen_string_literal: true

module Billing
  class SubscriptionSyncService
    def initialize(stripe_subscription, deleted: false)
      @stripe_sub = stripe_subscription
      @deleted    = deleted
    end

    def call
      company_sub = find_or_initialize_subscription
      return nil if company_sub.nil?

      old_status = company_sub.status

      update_subscription!(company_sub)
      update_company_plan!(company_sub)

      notify_status_change(company_sub, old_status)

      company_sub
    end

    private

    def find_or_initialize_subscription
      # 1. Tenta achar pela assinatura do Stripe existente
      sub = Billing::CompanySubscription.find_by(stripe_subscription_id: @stripe_sub.id)
      return sub if sub

      # 2. Tenta achar via metadata da assinatura
      company_id = @stripe_sub.metadata['company_id']

      # 3. Fallback: Tenta achar via stripe_customer_id pré-existente
      if company_id.blank?
        sub_by_cust = Billing::CompanySubscription.find_by(stripe_customer_id: @stripe_sub.customer)
        if sub_by_cust
          sub_by_cust.stripe_subscription_id = @stripe_sub.id
          return sub_by_cust
        end
      end

      # 4. Tenta achar a empresa
      company = ::Company.find_by(id: company_id) if company_id.present?

      # 5. Se não achar empresa por ID, tenta buscar pelo stripe_customer_id que possa estar direto na tabela
      if company.nil?
        company = ::Company.joins(:billing_company_subscription)
                           .find_by(billing_company_subscriptions: { stripe_customer_id: @stripe_sub.customer })
      end

      if company.nil?
        Rails.logger.warn("Company not found for Stripe customer: #{@stripe_sub.customer} (Sub ID: #{@stripe_sub.id})")

        if defined?(Billing::SlackNotifier)
          Billing::SlackNotifier.notify_unknown_company(
            stripe_sub_id: @stripe_sub.id,
            stripe_customer_id: @stripe_sub.customer,
            error: 'Company lookup failed'
          )
        end

        if defined?(Sentry)
          Sentry.capture_exception(
            StandardError.new("SubscriptionSyncService: Company not found for Stripe subscription #{@stripe_sub.id}")
          )
        end

        return nil
      end

      # 6. Inicializa ou reusa
      sub = Billing::CompanySubscription.find_or_initialize_by(company: company)
      sub.stripe_subscription_id = @stripe_sub.id
      sub
    end

    def update_subscription!(sub)
      stripe_status = @deleted ? 'canceled' : @stripe_sub.status
      price_id = @stripe_sub.items.data.first&.price&.id

      # Resolve o plano e associa para evitar erro de validação (Plan must exist)
      plan = ::Plan.find_by(stripe_price_id_monthly: price_id) || ::Plan.find_by(stripe_price_id_yearly: price_id)
      sub.plan = plan if plan
      sub.plan ||= ::Plan.find_by(name: 'Free') || ::Plan.first

      sub.update!(
        stripe_customer_id: @stripe_sub.customer,
        stripe_price_id: price_id,
        status: stripe_status,
        current_period_start: Time.at(@stripe_sub.current_period_start),
        current_period_end: Time.at(@stripe_sub.current_period_end),
        cancel_at_period_end: @stripe_sub.cancel_at_period_end || false,
        trial_start: @stripe_sub.trial_start&.then { |t| Time.at(t) },
        trial_end: @stripe_sub.trial_end&.then { |t| Time.at(t) },
        canceled_at: @stripe_sub.canceled_at&.then { |t| Time.at(t) } || (@deleted ? Time.current : nil),
        last_synced_at: Time.current
      )
    end

    def update_company_plan!(sub)
      # Resolução do plano pelo stripe_price_id
      plan = ::Plan.find_by(stripe_price_id_monthly: sub.stripe_price_id) || ::Plan.find_by(stripe_price_id_yearly: sub.stripe_price_id)

      # Se for active ou trialing, aplica o plano resolvido (ou mantém o plano da assinatura se não achou por price_id)
      target_plan = if sub.active_or_trialing?
                      plan || sub.plan || ::Plan.find_by(name: 'Free') || ::Plan.first
                    else
                      # Caso contrário, volta pro Free
                      ::Plan.find_by(name: 'Free') || ::Plan.first
                    end

      # Só atualiza o plano da empresa se for diferente, evitando callbacks desnecessários
      sub.company.update!(plan: target_plan) if sub.company.plan_id != target_plan.id

      # Atualiza a FK de plano na assinatura também
      return unless plan && sub.plan_id != plan.id

      sub.update!(plan: plan)
    end

    def notify_status_change(sub, old_status)
      # 1. Nova assinatura ativada (passou de incompleta/nil para active/trialing)
      if %w[active trialing].include?(sub.status) && (old_status.nil? || !%w[active trialing].include?(old_status))
        Billing::SlackNotifier.notify_new_subscription(company: sub.company, plan: sub.plan)
      end

      # 2. Assinatura Past Due
      if sub.status == 'past_due' && old_status != 'past_due'
        Billing::SlackNotifier.notify_subscription_past_due(company: sub.company, plan: sub.plan, since: Time.current)
      end

      # 3. Assinatura Cancelada
      return unless sub.status == 'canceled' && old_status != 'canceled'

      Billing::SlackNotifier.notify_subscription_canceled(
        company: sub.company,
        plan: sub.plan,
        reason: 'Stripe webhook subscription cancellation',
        period_end: sub.current_period_end
      )
    end
  end
end
