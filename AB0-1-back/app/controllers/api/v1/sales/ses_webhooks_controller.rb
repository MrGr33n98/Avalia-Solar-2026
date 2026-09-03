# frozen_string_literal: true

module Api
  module V1
    module Sales
      class SesWebhooksController < ActionController::API
        def create
          payload = parse_payload
          event_type = payload['eventType'] || payload['notificationType'] || 'delivered'
          mail_data = payload['mail'] || {}
          message_id = mail_data['messageId']

          email = ::Sales::EmailMessage.find_by(provider_message_id: message_id) if message_id.present?

          if email
            case event_type.to_s.downcase
            when 'delivery', 'delivered'
              email.register_event!(event_type: 'delivered', provider_event_id: "ses-#{message_id}-delivered", payload: payload)
            when 'bounce'
              email.register_event!(event_type: 'bounce', provider_event_id: "ses-#{message_id}-bounce", payload: payload)
            when 'complaint'
              email.register_event!(event_type: 'complaint', provider_event_id: "ses-#{message_id}-complaint", payload: payload)
            when 'reject'
              email.register_event!(event_type: 'reject', provider_event_id: "ses-#{message_id}-reject", payload: payload)
            end
          end

          render json: { status: 'success' }, status: :ok
        rescue StandardError => e
          Rails.logger.error("[SesWebhooksController] Erro no processamento de webhook: #{e.message}")
          render json: { error: e.message }, status: :ok # Handled gracefully to prevent SNS retries
        end

        private

        def parse_payload
          body = request.body.read
          json = JSON.parse(body) rescue {}
          if json['Message'].present? && json['Message'].is_a?(String)
            JSON.parse(json['Message']) rescue json
          else
            json
          end
        end
      end
    end
  end
end
