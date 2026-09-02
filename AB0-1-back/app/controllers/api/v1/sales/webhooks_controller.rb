module Api
  module V1
    module Sales
      class WebhooksController < BaseController
        def index
          endpoints = ::Sales::WebhookEndpoint.order(created_at: :desc)
          render json: { webhooks: endpoints.map { |endpoint| serialize(endpoint) } }
        end

        def create
          secret = SecureRandom.hex(32)
          endpoint = ::Sales::WebhookEndpoint.create_secure!(webhook_params.merge(created_by: current_user), secret: secret)
          render json: { webhook: serialize(endpoint).merge(secret: secret) }, status: :created
        end

        def destroy
          ::Sales::WebhookEndpoint.find(params[:id]).update!(active: false)
          head :no_content
        end

        private

        def webhook_params
          params.require(:webhook).permit(:company_id, :url, events: [])
        end

        def serialize(endpoint)
          { id: endpoint.id, url: endpoint.url, events: endpoint.events, active: endpoint.active,
            created_at: endpoint.created_at }
        end
      end
    end
  end
end
