# frozen_string_literal: true

module Api
  module V1
    module Sales
      class EmailEventsController < BaseController
        skip_before_action :authenticate_api_user, only: [:create]
        skip_before_action :require_internal_sales, only: [:create]

        before_action :verify_provider_authenticity, only: [:create]
        rescue_from ActionDispatch::Http::Parameters::ParseError, with: :render_malformed_request

        def create
          provider_msg_id = params[:provider_message_id] || params.dig(:mail, :messageId) || params.dig(:mail, :headers, :messageId)
          event_type = (params[:event_type] || params[:eventType] || 'delivered').downcase
          provider_event_id = params[:event_id] || params.dig(:mail, :messageId) || params[:MessageId] || SecureRandom.uuid

          # Idempotency check
          if ::Sales::EmailEvent.exists?(provider_event_id: provider_event_id)
            render json: { status: 'event_already_processed' }, status: :ok
            return
          end

          email = ::Sales::EmailMessage.find_by(provider_message_id: provider_msg_id)
          if email
            event = email.register_event!(
              event_type: event_type,
              provider_event_id: provider_event_id,
              url: params[:url],
              user_agent: request.user_agent,
              occurred_at: Time.current,
              payload: params.to_unsafe_h
            )
            render json: { status: 'event_processed', event_id: event.id }, status: :ok
          else
            render json: { status: 'email_not_found' }, status: :not_found
          end
        end

        private

        def render_malformed_request
          render json: { error: 'Malformed webhook payload' }, status: :bad_request
        end

        def verify_provider_authenticity
          secret = ENV['SALES_EMAIL_WEBHOOK_SECRET'].presence
          return true if secret.blank? && Rails.env.development?

          token = request.headers['X-Webhook-Token'] || params[:token]
          authorized = secret.present? && token.present? && token.to_s.bytesize == secret.bytesize &&
                       ActiveSupport::SecurityUtils.secure_compare(token.to_s, secret)
          render json: { error: 'Unauthorized webhook request' }, status: :unauthorized unless authorized
        end
      end
    end
  end
end
