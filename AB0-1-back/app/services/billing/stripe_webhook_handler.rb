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

        # Se falhou antes, vamos tentar processar novamente
        stripe_event.update!(processing_status: 'processing', error_message: nil)
      else
        stripe_event = record_event!(event)
        return :duplicate if stripe_event.processing_status == 'success'
      end

      # 3. Processar com proteção de concorrência e monotonicidade
      begin
        process_with_ordering_and_lock(event, stripe_event)
      rescue StandardError => e
        stripe_event.update!(processing_status: 'failed', error_message: e.message)
        if defined?(Billing::SlackNotifier)
          Billing::SlackNotifier.notify_webhook_failed(
            event_type: event.type,
            event_id: event.id,
            error: "#{e.class}: #{e.message}"
          )
        end
        raise e
      end
    end

    private

    def process_with_ordering_and_lock(event, stripe_event)
      sub_id = extract_subscription_id(event)
      cust_id = extract_customer_id(event)
      result = nil

      ActiveRecord::Base.transaction do
        sub = find_subscription_for_lock(sub_id, cust_id)

        if sub
          sub.with_lock do
            if stale_event?(event, sub_id)
              stripe_event.update!(
                processing_status: 'skipped_stale',
                error_message: "Stale event: created at #{event_timestamp(event)} < latest applied event"
              )
              result = :skipped_stale
            else
              dispatch(event)
              stripe_event.update!(processing_status: 'success')
              result = :success
            end
          end
        else
          if stale_event?(event, sub_id)
            stripe_event.update!(
              processing_status: 'skipped_stale',
              error_message: "Stale event: created at #{event_timestamp(event)} < latest applied event"
            )
            result = :skipped_stale
          else
            dispatch(event)
            stripe_event.update!(processing_status: 'success')
            result = :success
          end
        end
      end

      result
    end

    def find_subscription_for_lock(sub_id, cust_id)
      if sub_id.present?
        sub = Billing::CompanySubscription.find_by(stripe_subscription_id: sub_id)
        return sub if sub
      end

      if cust_id.present?
        Billing::CompanySubscription.find_by(stripe_customer_id: cust_id)
      end
    end

    def extract_subscription_id(event)
      obj = event.respond_to?(:data) && event.data.respond_to?(:object) ? event.data.object : nil
      return nil if obj.nil?

      if event.type.start_with?('customer.subscription.')
        obj.respond_to?(:id) ? obj.id : nil
      elsif event.type.start_with?('invoice.')
        obj.respond_to?(:subscription) ? obj.subscription : nil
      end
    end

    def extract_customer_id(event)
      obj = event.respond_to?(:data) && event.data.respond_to?(:object) ? event.data.object : nil
      return nil if obj.nil?

      obj.respond_to?(:customer) ? obj.customer : nil
    end

    def event_timestamp(event)
      ts = event.respond_to?(:created) && event.created.present? ? event.created.to_i : 0
      if ts.zero? && event.respond_to?(:data) && event.data.respond_to?(:object)
        ts = event.data.object.respond_to?(:created) && event.data.object.created.present? ? event.data.object.created.to_i : 0
      end
      ts
    end

    def stale_event?(event, sub_id)
      return false if sub_id.blank?

      incoming_ts = event_timestamp(event)
      return false if incoming_ts.zero?

      latest_event = Billing::StripeEvent
                     .where(processing_status: 'success')
                     .where.not(stripe_event_id: event.id)
                     .where("raw_payload->'data'->'object'->>'id' = :sub_id OR raw_payload->'data'->'object'->>'subscription' = :sub_id", sub_id: sub_id)
                     .order(Arel.sql("(raw_payload->>'created')::bigint DESC NULLS LAST"))
                     .first

      return false if latest_event.nil?

      latest_ts = (latest_event.raw_payload['created'] || latest_event.raw_payload.dig('data', 'object', 'created')).to_i
      return false if latest_ts.zero?

      incoming_ts < latest_ts
    end

    def verify_and_parse!
      # Em modo de teste, se mockado, aceita diretamente
      return JSON.parse(@payload, object_class: OpenStruct) if Rails.env.test? && @signature == 'mock_sig'

      Stripe::Webhook.construct_event(
        @payload,
        @signature,
        ENV.fetch('STRIPE_BILLING_WEBHOOK_SECRET', 'mock_secret')
      )
    rescue Stripe::SignatureVerificationError => e
      Billing::SlackNotifier.notify_invalid_webhook(error: e.message) if defined?(Billing::SlackNotifier)
      raise ::Billing::Errors::InvalidWebhookSignature, e.message
    end

    def record_event!(event)
      parsed_payload = begin
        JSON.parse(@payload)
      rescue StandardError
        event.respond_to?(:to_h) ? event.to_h : {}
      end

      Billing::StripeEvent.create!(
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: Time.current,
        processing_status: 'processing',
        raw_payload: parsed_payload
      )
    rescue ActiveRecord::RecordNotUnique
      Billing::StripeEvent.find_by(stripe_event_id: event.id)
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
