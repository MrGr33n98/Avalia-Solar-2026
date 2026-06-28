# frozen_string_literal: true

module Billing
  class ReconciliationJob < ApplicationJob
    queue_as :default

    def perform
      # Itera sobre todas as assinaturas locais que possuem integração ativa no Stripe
      Billing::CompanySubscription.where.not(stripe_subscription_id: nil).find_each do |sub|
        stripe_sub = Stripe::Subscription.retrieve(sub.stripe_subscription_id)

        # Detecta divergência de status ou fim de período (diferença de mais de 1 hora)
        status_divergent = sub.status != stripe_sub.status
        period_divergent = (sub.current_period_end.to_i - stripe_sub.current_period_end).abs > 3600

        if status_divergent || period_divergent
          # Envia o alerta síncrono para o canal de faturamento técnico
          Billing::SlackNotifier.notify_reconciliation_divergence(
            company: sub.company,
            local_status: sub.status,
            local_period_end: sub.current_period_end,
            stripe_status: stripe_sub.status,
            stripe_period_end: Time.at(stripe_sub.current_period_end)
          )

          # Auto-sincroniza (Stripe é a fonte da verdade!)
          ::Billing::SubscriptionSyncService.new(stripe_sub).call

          # Encontra ou cria administrador fictício de sistema para contornar a restrição física NOT NULL do banco de dados
          system_admin = ::AdminUser.first || ::AdminUser.create!(
            email: 'system_reconciliation@example.com',
            password: 'password123',
            password_confirmation: 'password123'
          )

          # Registra no histórico de auditoria
          ::Billing::AdminAction.create!(
            admin_user: system_admin,
            company: sub.company,
            company_subscription: sub,
            action_type: 'sync_stripe',
            justification: "Divergência auto-sincronizada via ReconciliationJob. Stripe: status=#{stripe_sub.status}, Banco: status=#{sub.status}",
            performed_at: Time.current
          )

          Rails.logger.warn("[Billing::ReconciliationJob] Divergência corrigida para company_id=#{sub.company_id}")
        end
      rescue Stripe::StripeError => e
        Rails.logger.error("[Billing::ReconciliationJob] Stripe API Error para sub #{sub.stripe_subscription_id}: #{e.message}")
      rescue StandardError => e
        Rails.logger.error("[Billing::ReconciliationJob] Erro inesperado para sub #{sub.stripe_subscription_id}: #{e.message}")
      end
    end
  end
end
