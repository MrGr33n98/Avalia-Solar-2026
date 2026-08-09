module Webhooks
  class MercadopagoHandler
    def initialize(params)
      @params = params
    end

    def call
      # MercadoPago hooks can be IPN or Webhook
      resource_id = @params.dig('data', 'id') || @params['id']
      resource_type = @params['type'] || @params['topic']

      return unless resource_type == 'payment'

      # Idempotency check
      webhook_event = PaymentWebhookEvent.find_or_initialize_by(
        provider: 'mercadopago',
        provider_event_id: resource_id.to_s
      )
      return if webhook_event.persisted? && webhook_event.status == 'processed'

      webhook_event.event_type = resource_type
      webhook_event.payload = @params
      webhook_event.save!
      
      # Mock check
      return mock_handle(webhook_event) if ENV['MERCADOPAGO_ACCESS_TOKEN'].blank?

      sdk = Mercadopago::SDK.new(ENV['MERCADOPAGO_ACCESS_TOKEN'])
      payment_info = sdk.payment.get(resource_id)
      
      payment_data = payment_info[:response]
      if payment_data && payment_data['status'] == 'approved'
        checkout_session_id = payment_data['external_reference']
        resolved = Payments::BannerSubscriptionResolver.find_by_checkout_session(checkout_session_id)
        
        if resolved
          sub = resolved[:subscription]
          if resolved[:type] == :new
            unless sub.status == 'active'
              sub.update!(payment_reference: resource_id.to_s, payment_provider: 'mercadopago')
              BannerAddons::LifecycleService.new(sub).activate!
            end
          else
            unless sub.active?
              sub.update!(payment_reference: resource_id.to_s, provider: 'mercadopago')
              ends_at = Time.current + sub.banner_offer.duration_days.days
              sub.activate!(starts_at: Time.current, ends_at: ends_at)
            end
          end
        end
      end

      webhook_event.processed!
    rescue StandardError => e
      webhook_event&.failed!(e.message)
      raise e
    end

    private

    def mock_handle(webhook_event)
      # Simple mock simulation
      checkout_session_id = @params['external_reference']
      resolved = Payments::BannerSubscriptionResolver.find_by_checkout_session(checkout_session_id)
      
      if resolved && @params['status'] == 'approved'
        sub = resolved[:subscription]
        if resolved[:type] == :new
          unless sub.status == 'active'
            BannerAddons::LifecycleService.new(sub).activate!
          end
        else
          unless sub.active?
            sub.activate!(starts_at: Time.current, ends_at: Time.current + 30.days)
          end
        end
      end

      webhook_event.processed!
    end
  end
end
