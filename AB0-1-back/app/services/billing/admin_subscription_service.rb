# frozen_string_literal: true

module Billing
  class AdminSubscriptionService
    def initialize(company:, admin_user:, justification:, ip_address: nil)
      @company       = company
      @admin         = admin_user
      @justification = justification
      @ip_address    = ip_address
    end

    def mark_as_enterprise!(notes: nil)
      with_audit('mark_enterprise', metadata: { notes: notes }) do
        enterprise_plan = ::Plan.find_by(name: 'Enterprise') || ::Plan.first
        sub = find_or_initialize_subscription
        sub.plan = enterprise_plan
        sub.update!(
          status: 'manual',
          is_enterprise_manual: true,
          enterprise_notes: notes,
          stripe_price_id: nil # Não é controlado por preço do Stripe
        )
        @company.update!(plan: enterprise_plan)
        
        Billing::SlackNotifier.notify_enterprise_manual(
          company: @company,
          admin: @admin,
          notes: notes
        )
        sub
      end
    end

    def force_downgrade_to_free!(reason:)
      with_audit('force_downgrade', metadata: { reason: reason }) do
        sub = find_subscription!
        
        # Cancela no Stripe se houver assinatura ativa
        if sub.stripe_subscription_id.present? && sub.status != 'canceled'
          begin
            Stripe::Subscription.cancel(sub.stripe_subscription_id)
          rescue Stripe::StripeError => e
            Rails.logger.error("[Billing::AdminSubscriptionService] Stripe cancellation failed: #{e.message}")
          end
        end

        sub.update!(
          status: 'canceled',
          canceled_at: Time.current,
          stripe_price_id: nil
        )
        
        free_plan = ::Plan.find_by(name: 'Free') || ::Plan.first
        @company.update!(plan: free_plan)
        sub.update!(plan: free_plan)

        Billing::SlackNotifier.notify_force_downgrade(
          company: @company,
          admin: @admin,
          reason: reason
        )
        sub
      end
    end

    def sync_with_stripe!
      with_audit('sync_stripe') do
        sub = find_subscription!
        raise "Cannot sync. stripe_subscription_id is missing." if sub.stripe_subscription_id.blank?

        stripe_sub = Stripe::Subscription.retrieve(sub.stripe_subscription_id)
        Billing::SubscriptionSyncService.new(stripe_sub).call
      end
    end

    def cancel_at_period_end!
      with_audit('cancel_at_period_end') do
        sub = find_subscription!
        raise "Cannot cancel at period end. stripe_subscription_id is missing." if sub.stripe_subscription_id.blank?

        Stripe::Subscription.update(sub.stripe_subscription_id, cancel_at_period_end: true)
        sub.update!(cancel_at_period_end: true)

        # Envia notificação de cancelamento
        Billing::SlackNotifier.notify_subscription_canceled(
          company: @company,
          plan: sub.plan,
          reason: 'Cancelamento agendado por Administrador',
          period_end: sub.current_period_end
        )
        sub
      end
    end

    private

    def find_subscription!
      sub = Billing::CompanySubscription.find_by!(company: @company)
      sub
    end

    def find_or_initialize_subscription
      Billing::CompanySubscription.find_or_initialize_by(company: @company)
    end

    def with_audit(action_type, metadata: {})
      sub = Billing::CompanySubscription.find_by(company: @company)
      
      result = yield
      
      # Recarrega a assinatura pós-yield para pegar novo estado se criada/modificada
      sub ||= Billing::CompanySubscription.find_by(company: @company)

      Billing::AdminAction.create!(
        admin_user: @admin,
        company: @company,
        company_subscription: sub,
        action_type: action_type,
        justification: @justification,
        metadata: metadata,
        performed_at: Time.current,
        ip_address: @ip_address
      )
      result
    end
  end
end
