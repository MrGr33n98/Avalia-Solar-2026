module Api
  module V1
    class PaymentsWebhooksController < ActionController::API
      ALLOWED_PROVIDERS = %w[stripe mercadopago pagarme mock].freeze
      
      before_action :validate_provider
      before_action :verify_webhook_signature, unless: :stripe_provider?
      
      def create
        case params[:provider]
        when 'stripe'
          Webhooks::StripeHandler.new(request.raw_post, request.headers['Stripe-Signature']).call
        when 'mercadopago'
          Webhooks::MercadopagoHandler.new(params.to_unsafe_h).call
        when 'mock'
          handle_mock_webhook
        end

        return if performed?

        render json: { ok: true }
      rescue Webhooks::SecurityService::InvalidSignatureError => e
        log_security_failure('invalid_signature', e)
        render json: { error: 'Invalid signature' }, status: :unauthorized
      rescue Webhooks::SecurityService::MissingSecretError => e
        log_security_failure('missing_secret', e)
        render json: { error: 'Configuration error' }, status: :internal_server_error
      rescue StandardError => e
        log_webhook_error(e)
        render json: { error: e.message }, status: :internal_server_error
      end

      private

      def handle_mock_webhook
        data = webhook_payload
        checkout_session_id = data['checkout_session_id'] || params[:checkout_session_id]
        status = data['status'] || params[:status]
        sub = ::BannerSubscription.find_by(checkout_session_id: checkout_session_id)
        return render json: { error: 'subscription_not_found' }, status: :not_found if sub.nil?

        if %w[success paid].include?(status)
          ends_at = Time.current + sub.banner_offer.duration_days.days
          sub.activate!(starts_at: Time.current, ends_at: ends_at)
        end
      end

      def validate_provider
        return if ALLOWED_PROVIDERS.include?(params[:provider])
        
        Rails.logger.warn({
          event: 'webhook_provider_rejected',
          provider: params[:provider],
          ip: request.remote_ip,
          user_agent: request.user_agent,
          timestamp: Time.current.iso8601,
          reason: 'invalid_provider'
        }.to_json)
        
        render json: { error: 'Invalid provider' }, status: :unprocessable_entity
      end

      def stripe_provider?
        params[:provider] == 'stripe'
      end

      def verify_webhook_signature
        signature = request.headers['X-Webhook-Signature']
        timestamp = request.headers['X-Webhook-Timestamp']
        
        if signature.blank?
          log_security_failure('missing_signature')
          return render json: { error: 'Missing signature' }, status: :unauthorized
        end

        begin
          Webhooks::SecurityService.new(
            provider: params[:provider],
            payload: request.raw_post,
            signature: signature,
            timestamp: timestamp
          ).verify!
        rescue Webhooks::SecurityService::InvalidSignatureError => e
          log_security_failure('invalid_signature', e)
          render json: { error: 'Invalid signature' }, status: :unauthorized
        rescue Webhooks::SecurityService::TimestampExpiredError => e
          log_security_failure('timestamp_expired', e)
          render json: { error: 'Timestamp expired' }, status: :unauthorized
        rescue Webhooks::SecurityService::MissingSecretError => e
          log_security_failure('missing_secret', e)
          render json: { error: 'Configuration error' }, status: :internal_server_error
        end
      end

      def webhook_payload
        return {} if request.raw_post.blank?

        JSON.parse(request.raw_post)
      rescue JSON::ParserError
        {}
      end

      def log_webhook_success(subscription, status)
        Rails.logger.info({
          event: 'webhook_processed',
          provider: params[:provider],
          subscription_id: subscription.id,
          status: status,
          ip: request.remote_ip,
          timestamp: Time.current.iso8601
        }.to_json)
      end

      def log_webhook_error(error)
        Rails.logger.error({
          event: 'webhook_processing_error',
          provider: params[:provider],
          error_class: error.class.name,
          error_message: error.message,
          ip: request.remote_ip,
          timestamp: Time.current.iso8601
        }.to_json)
      end

      def log_security_failure(reason, error = nil)
        Rails.logger.warn({
          event: 'webhook_security_failure',
          provider: params[:provider],
          reason: reason,
          error_message: error&.message,
          ip: request.remote_ip,
          user_agent: request.user_agent,
          timestamp: Time.current.iso8601
        }.to_json)
      end
    end
  end
end
