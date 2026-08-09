module Webhooks
  class StripeHandler
    def initialize(payload, signature_header)
      @payload = payload
      @signature_header = signature_header
    end

    def call
      raise Webhooks::SecurityService::InvalidSignatureError, 'Missing Stripe signature' if @signature_header.blank?
      secret = ENV['STRIPE_WEBHOOK_SECRET']
      raise Webhooks::SecurityService::MissingSecretError, 'STRIPE_WEBHOOK_SECRET not configured' if secret.blank?

      event = Stripe::Webhook.construct_event(
        @payload, @signature_header, secret
      )

      # Idempotency check
      webhook_event = PaymentWebhookEvent.find_or_initialize_by(
        provider: 'stripe',
        provider_event_id: event.id
      )
      return if webhook_event.persisted? && webhook_event.status == 'processed'

      webhook_event.event_type = event.type
      webhook_event.payload = event.as_json
      webhook_event.save!

      case event.type
      when 'checkout.session.completed'
        handle_checkout_completed(event.data.object)
      end

      webhook_event.processed!
    rescue Stripe::SignatureVerificationError => e
      Rails.logger.error "Stripe Webhook Signature Verification Failed: #{e.message}"
      raise Webhooks::SecurityService::InvalidSignatureError, e.message
    rescue StandardError => e
      webhook_event&.failed!(e.message)
      raise e
    end

    private

    def handle_checkout_completed(session)
      checkout_session_id = session.client_reference_id
      resolved = Payments::BannerSubscriptionResolver.find_by_checkout_session(checkout_session_id)
      return if resolved.nil?

      sub = resolved[:subscription]

      if resolved[:type] == :new
        sub.update!(payment_reference: session.payment_intent, payment_provider: 'stripe')
        BannerAddons::LifecycleService.new(sub).activate!
      else
        # Legacy
        sub.update!(payment_reference: session.payment_intent, provider: 'stripe')
        ends_at = Time.current + sub.banner_offer.duration_days.days
        sub.activate!(starts_at: Time.current, ends_at: ends_at)
      end
    end
  end
end
