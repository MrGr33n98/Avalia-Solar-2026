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

      case event.type
      when 'checkout.session.completed'
        handle_checkout_completed(event.data.object)
      end
    rescue Stripe::SignatureVerificationError => e
      Rails.logger.error "Stripe Webhook Signature Verification Failed: #{e.message}"
      raise Webhooks::SecurityService::InvalidSignatureError, e.message
    end

    private

    def handle_checkout_completed(session)
      checkout_session_id = session.client_reference_id
      sub = BannerSubscription.find_by(checkout_session_id: checkout_session_id)
      return if sub.nil?

      sub.update!(payment_reference: session.payment_intent, provider: 'stripe')
      
      ends_at = Time.current + sub.banner_offer.duration_days.days
      sub.activate!(starts_at: Time.current, ends_at: ends_at)
    end
  end
end
