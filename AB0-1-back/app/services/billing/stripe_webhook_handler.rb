# frozen_string_literal: true

module Billing
  class StripeWebhookHandler
    HANDLED_EVENTS = %w[
      customer.subscription.created
      customer.subscription.updated
      customer.subscription.deleted
      invoice.payment_succeeded
      invoice.payment_failed
    ].freeze

    def initialize(payload:, signature:)
      @payload   = payload
      @signature = signature
    end

    def call
      event = verify_and_parse!

      # 1. Ignorar se não for um dos eventos que nós processamos
      return :skipped unless HANDLED_EVENTS.include?(event.type)

      # 2. Idempotência: verificar se já processado
      stripe_event = Billing::StripeEvent.find_by(stripe_event_id: event.id)
      if stripe_event
        return :duplicate if stripe_event.processing_status == 'success'


        # Se falhou antes, vamos tentar processar novamente removendo o anterior ou atualizando ele
        stripe_event.update!(processing_status: 'processing', error_message: nil)

      else
        stripe_event = record_event!(event)
      end

      # 3. Processar
      begin
        ActiveRecord::Base.transaction do
          dispatch(event)
        end
        stripe_event.update!(processing_status: 'success')
        :success
      rescue StandardError => e
        stripe_event.update!(processing_status: 'failed', error_message: e.message)
        Billing::SlackNotifier.notify_webhook_failed(
          event_type: event.type,
          event_id: event.id,
          error: "#{e.class}: #{e.message}"
        )
        raise e
      end
    end

    private

    def verify_and_parse!
      # Em modo de teste, se mockado, aceita diretamente
      return JSON.parse(@payload, object_class: OpenStruct) if Rails.env.test? && @signature == 'mock_sig'

      Stripe::Webhook.construct_event(
        @payload,
        @signature,
        ENV.fetch('STRIPE_BILLING_WEBHOOK_SECRET', 'mock_secret')
      )
    rescue Stripe::SignatureVerificationError => e
      Billing::SlackNotifier.notify_invalid_webhook(error: e.message)
      raise ::Billing::Errors::InvalidWebhookSignature, e.message
    end

    def record_event!(event)
      Billing::StripeEvent.create!(
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: Time.current,
        processing_status: 'processing',
        raw_payload: event.respond_to?(:to_h) ? event.to_h : JSON.parse(@payload)
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

    def handle_payment_succeeded(invoice)
      # Se não for uma invoice de assinatura, ignora
      return if invoice.subscription.blank?

      # Encontra a assinatura local via stripe_customer_id ou stripe_subscription_id
      sub = Billing::CompanySubscription.find_by(stripe_subscription_id: invoice.subscription) ||
            Billing::CompanySubscription.find_by(stripe_customer_id: invoice.customer)

      return if sub.nil?

      # Notifica
      Billing::SlackNotifier.notify_payment_succeeded(
        company: sub.company,
        amount_cents: invoice.amount_paid,
        plan: sub.plan
      )
    end

    def handle_payment_failed(invoice)
      # Encontra a assinatura local via stripe_customer_id ou stripe_subscription_id
      sub = Billing::CompanySubscription.find_by(stripe_subscription_id: invoice.subscription) ||
            Billing::CompanySubscription.find_by(stripe_customer_id: invoice.customer)

      return if sub.nil?

      # Atualiza erros de pagamento na assinatura local
      sub.update!(
        last_payment_error: invoice.last_payment_error&.message || 'Payment failed',
        last_payment_error_at: Time.current
      )

      # Notifica
      Billing::SlackNotifier.notify_payment_failed(
        company: sub.company,
        amount_cents: invoice.amount_due,
        decline_reason: invoice.charge_failure_code || 'payment_failed',
        attempt_count: invoice.attempt_count
      )
    end
  end
end
