module Api
  module V1
    class PaymentsWebhooksController < ActionController::API
      ALLOWED_PROVIDERS = %w[stripe mercadopago pagarme mock].freeze
      
      before_action :validate_provider
      before_action :verify_webhook_signature
      
      def create
        provider = params[:provider].to_s
        status = params[:status].to_s
        checkout_session_id = params[:checkout_session_id].to_s
        payment_reference = params[:payment_reference].to_s

        sub = ::BannerSubscription.find_by(checkout_session_id: checkout_session_id)
        return render json: { error: 'subscription_not_found' }, status: :not_found if sub.nil?

        sub.update!(provider: provider) if provider.present?
        sub.update!(payment_reference: payment_reference) if payment_reference.present?

        case status
        when 'paid', 'succeeded', 'success'
          ends_at = sub.starts_at ? (sub.starts_at + sub.banner_offer.duration_days.days) : (Time.current + sub.banner_offer.duration_days.days)
          sub.activate!(starts_at: Time.current, ends_at: ends_at)

          company_id = sub.respond_to?(:company_id) ? sub.company_id : nil
          PostHog.capture(
            distinct_id: company_id ? "company_#{company_id}" : "anon_sub_#{sub.id}",
            event: 'banner_subscription_activated',
            properties: {
              subscription_id: sub.id,
              company_id: company_id,
              provider: provider,
              duration_days: sub.banner_offer&.duration_days
            }.compact
          )

          log_webhook_success(sub, status)
          render json: { ok: true }
        when 'failed'
          sub.update!(status: 'failed', failure_reason: params[:failure_reason].to_s.presence)
          
          log_webhook_success(sub, status)
          render json: { ok: true }
        else
          render json: { ok: true, ignored: true }
        end
      rescue StandardError => e
        log_webhook_error(e)
        render json: { error: 'Internal server error' }, status: :internal_server_error
      end

      private

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
