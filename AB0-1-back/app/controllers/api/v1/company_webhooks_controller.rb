module Api
  module V1
    class CompanyWebhooksController < BaseController
      before_action :authenticate_api_user
      before_action :require_company_user
      before_action :set_company
      before_action :ensure_webhooks_available!
      before_action :set_webhook, only: %i[update destroy]

      def index
        webhooks = @company.company_webhooks.order(created_at: :desc)

        render json: {
          webhooks: webhooks.map { |webhook| webhook_payload(webhook) }
        }
      end

      def create
        webhook = @company.company_webhooks.new(webhook_params)

        if webhook.save
          render json: {
            webhook: webhook_payload(webhook, expose_secret: true)
          }, status: :created
        else
          render json: { errors: webhook.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        rotate_secret! if ActiveModel::Type::Boolean.new.cast(params[:rotate_secret])

        if @webhook.update(webhook_params)
          render json: {
            webhook: webhook_payload(@webhook, expose_secret: ActiveModel::Type::Boolean.new.cast(params[:rotate_secret]))
          }
        else
          render json: { errors: @webhook.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @webhook.destroy!
        head :no_content
      end

      private

      def set_company
        @company = current_user&.company
        return if @company.present?

        render_error_response(
          message: 'Empresa não encontrada ou não autorizada',
          status: :forbidden,
          code: 'COMPANY_NOT_FOUND'
        )
      end

      def ensure_webhooks_available!
        return if @company&.can_use_webhooks?

        render_error_response(
          message: 'Webhooks disponíveis apenas para empresas Enterprise.',
          status: :forbidden,
          code: 'WEBHOOKS_NOT_AVAILABLE'
        )
      end

      def set_webhook
        @webhook = @company.company_webhooks.find(params[:id])
      end

      def webhook_params
        params.require(:company_webhook).permit(:url, :active, events: [])
      end

      def rotate_secret!
        @webhook.secret_key = SecureRandom.hex(32)
      end

      def webhook_payload(webhook, expose_secret: false)
        payload = webhook.as_json(only: %i[id url active events created_at updated_at])
        payload['secret_key'] = webhook.secret_key if expose_secret
        payload
      end
    end
  end
end
