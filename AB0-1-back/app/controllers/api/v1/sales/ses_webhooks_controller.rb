# frozen_string_literal: true

require 'net/http'
require 'uri'

module Api
  module V1
    module Sales
      class SesWebhooksController < ActionController::API
        def create
          unless request.media_type == 'application/json'
            log_failure(nil, 'SNS JSON envelope required', status: 401)
            return render json: { error: 'Unauthorized webhook request' }, status: :unauthorized
          end

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
              provider_event_id = "sns-#{envelope.fetch('MessageId')}"
              email.register_event!(
                event_type: normalized_type,
                provider_event_id: provider_event_id,
                dedupe_key: provider_event_id,
                source: 'aws_ses_sns',
                occurred_at: event_time(payload),
                payload: safe_event_payload(payload)
              )
              if %w[bounce complaint].include?(normalized_type)
                ::Sales::EmailSuppression.find_or_create_by!(company_id: email.company_id, email: email.to_email) do |item|
                  item.reason = normalized_type
                  item.suppressed_at = Time.current
                end
                if email.contact
                  ::Sales::EmailSequences::EnrollmentProcessor.stop_for_contact(
                    contact: email.contact, reason: normalized_type
                  )
                end
              end
            else
              log_failure(envelope, 'provider_message_not_persisted_yet', status: 503)
              return render json: { error: 'Message ainda não foi persistido.' }, status: :service_unavailable
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
          log_failure(envelope, "Internal error: #{e.class.name}", status: 500)
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
          'open' => 'provider_open_signal',
          'click' => 'provider_click_signal'
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

        EVENT_TIMESTAMP_KEYS = %w[delivery bounce complaint deliveryDelay open click reject].freeze

        def event_time(payload)
          detail_key = EVENT_TIMESTAMP_KEYS.find { |key| payload[key].is_a?(Hash) && payload[key]['timestamp'].present? }
          raw = detail_key ? payload.dig(detail_key, 'timestamp') : payload.dig('mail', 'timestamp')
          Time.iso8601(raw.to_s)
        rescue ArgumentError
          Time.current
        end

        def safe_event_payload(payload)
          mail = payload['mail'].is_a?(Hash) ? payload['mail'] : {}
          detail_key = %w[bounce complaint delivery reject].find { |key| payload[key].is_a?(Hash) }
          event_details = payload[detail_key] || {}
          {
            event_type: payload['eventType'] || payload['notificationType'],
            provider_message_id: mail['messageId'],
            occurred_at: mail['timestamp'],
            bounce_type: event_details['bounceType'],
            complaint_type: event_details['complaintFeedbackType']
          }.compact
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
