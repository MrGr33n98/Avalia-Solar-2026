# frozen_string_literal: true

module Api
  module V1
    module Billing
      class WebhooksController < Api::V1::BaseController
        # Webhooks não utilizam autenticação JWT
        skip_before_action :authenticate_api_user, raise: false

        def stripe
          payload   = request.body.read
          signature = request.env['HTTP_STRIPE_SIGNATURE']

          result = ::Billing::StripeWebhookHandler.new(
            payload: payload,
            signature: signature
          ).call

          if result == :duplicate
            render json: { message: 'Event already processed' }, status: :ok
          else
            render json: { message: 'Success' }, status: :ok
          end
        rescue ::Billing::Errors::InvalidWebhookSignature => e
          render json: { error: e.message }, status: :bad_request
        rescue StandardError => e
          Rails.logger.error("[Billing::Webhook] #{e.class}: #{e.message}")
          # Envia para o Sentry se configurado
          Sentry.capture_exception(e) if defined?(Sentry)
          render json: { error: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
