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
      
      # Mock check
      return mock_handle if ENV['MERCADOPAGO_ACCESS_TOKEN'].blank?

      sdk = Mercadopago::SDK.new(ENV['MERCADOPAGO_ACCESS_TOKEN'])
      payment_info = sdk.payment.get(resource_id)
      
      payment_data = payment_info[:response]
      return unless payment_data && payment_data['status'] == 'approved'

      checkout_session_id = payment_data['external_reference']
      sub = BannerSubscription.find_by(checkout_session_id: checkout_session_id)
      return if sub.nil? || sub.active?

      sub.update!(payment_reference: resource_id.to_s, provider: 'mercadopago')
      
      ends_at = Time.current + sub.banner_offer.duration_days.days
      sub.activate!(starts_at: Time.current, ends_at: ends_at)
    end

    private

    def mock_handle
      # Simple mock simulation
      sub = BannerSubscription.find_by(checkout_session_id: @params['external_reference'])
      if sub && @params['status'] == 'approved'
        sub.activate!(starts_at: Time.current, ends_at: Time.current + 30.days)
      end
    end
  end
end
