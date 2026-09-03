# frozen_string_literal: true

require 'net/http'
require 'uri'

module Api
  module V1
    module Sales
      class SesWebhooksController < ActionController::API
        def create
          envelope = JSON.parse(request.body.read)
          ::Sales::Messaging::SnsMessageVerifier.verify!(envelope)

          if envelope['Type'] == 'SubscriptionConfirmation'
            confirm_subscription!(envelope['SubscribeURL'])
            return render json: { status: 'subscription_confirmed' }, status: :ok
          end

          payload = envelope['Message'].is_a?(String) ? JSON.parse(envelope['Message']) : envelope['Message'].to_h
          event_type = payload['eventType'] || payload['notificationType'] || 'delivered'
          message_id = payload.dig('mail', 'messageId')
          email = ::Sales::EmailMessage.find_by(provider_message_id: message_id) if message_id.present?

          if email
            provider_event_id = "ses-#{message_id}-#{event_type.to_s.downcase}"
            email.register_event!(event_type: normalized_event(event_type), provider_event_id: provider_event_id, payload: payload)
          end

          render json: { status: 'success' }, status: :ok
        rescue SecurityError => e
          Rails.logger.warn("[SesWebhooksController] SNS rejeitado: #{e.message}")
          render json: { error: 'Unauthorized webhook request' }, status: :unauthorized
        rescue JSON::ParserError
          render json: { error: 'Malformed webhook payload' }, status: :bad_request
        rescue StandardError => e
          Rails.logger.error("[SesWebhooksController] Erro no processamento de webhook: #{e.message}")
          render json: { error: 'Webhook processing failed' }, status: :internal_server_error
        end

        private

        def normalized_event(event_type)
          value = event_type.to_s.downcase
          return 'delivered' if value == 'delivery'
          return value if ::Sales::EmailEvent::EVENT_TYPES.include?(value)

          'delivery_delay'
        end

        def confirm_subscription!(subscribe_url)
          uri = URI.parse(subscribe_url.to_s)
          allowed_host = uri.host&.match?( /\Asns\.[a-z0-9-]+\.amazonaws\.com\.?\z/i )
          raise SecurityError, 'SNS SubscribeURL inválida' unless uri.is_a?(URI::HTTPS) && allowed_host

          Net::HTTP.start(uri.host, uri.port, use_ssl: true, open_timeout: 5, read_timeout: 5) do |http|
            response = http.get(uri.request_uri)
            raise 'Falha ao confirmar assinatura SNS' unless response.is_a?(Net::HTTPSuccess)
          end
        end
      end
    end
  end
end
