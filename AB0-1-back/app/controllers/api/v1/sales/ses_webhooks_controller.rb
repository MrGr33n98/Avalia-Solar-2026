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
          raw_event_type = payload['eventType'] || payload['notificationType']
          message_id = payload.dig('mail', 'messageId')
          normalized_type = normalized_event(raw_event_type)

          if normalized_type.present? && message_id.present?
            email = ::Sales::EmailMessage.find_by(provider_message_id: message_id)
            if email
              provider_event_id = "ses-#{message_id}-#{normalized_type}"
              email.register_event!(event_type: normalized_type, provider_event_id: provider_event_id, payload: payload)
              if %w[bounce complaint].include?(normalized_type)
                ::Sales::EmailSuppression.find_or_create_by!(company_id: email.company_id, email: email.to_email) do |item|
                  item.reason = normalized_type
                  item.suppressed_at = Time.current
                end
              end
            end
          end

          render json: { status: 'success' }, status: :ok
        rescue SecurityError => e
          log_failure(envelope, e.message, status: 401)
          render json: { error: 'Unauthorized webhook request' }, status: :unauthorized
        rescue JSON::ParserError => e
          log_failure(nil, "Malformed JSON: #{e.message}", status: 400)
          render json: { error: 'Malformed webhook payload' }, status: :bad_request
        rescue StandardError => e
          log_failure(envelope, "Internal error: #{e.message}", status: 500)
          render json: { error: 'Webhook processing failed' }, status: :internal_server_error
        end

        private

        EVENT_TYPE_MAPPING = {
          'send' => nil,
          'delivery' => 'delivered',
          'delivered' => 'delivered',
          'deliverydelay' => 'delivery_delay',
          'delivery_delay' => 'delivery_delay',
          'bounce' => 'bounce',
          'bounced' => 'bounce',
          'complaint' => 'complaint',
          'reject' => 'reject',
          'rejected' => 'reject',
          'open' => 'open',
          'click' => 'click'
        }.freeze

        def log_failure(envelope, reason, status:)
          Rails.logger.warn(
            "[SesWebhooksController] SNS webhook falhou [#{status}]: " \
            "request_id=#{request.request_id} " \
            "type=#{envelope&.[]('Type')} " \
            "topic_arn=#{envelope&.[]('TopicArn')} " \
            "reason=#{reason}"
          )
        end

        def normalized_event(event_type)
          return nil if event_type.blank?

          key = event_type.to_s.downcase.gsub(/[^a-z_]/, '')
          return EVENT_TYPE_MAPPING[key] if EVENT_TYPE_MAPPING.key?(key)

          if ::Sales::EmailEvent::EVENT_TYPES.include?(key)
            key
          else
            Rails.logger.info("[SesWebhooksController] Evento SES desconhecido/ignorado: #{event_type}")
            nil
          end
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
