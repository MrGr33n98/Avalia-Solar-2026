module Api
  module V1
    module Sales
      class EmailSuppressionsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          render json: { suppressions: scoped.order(created_at: :desc).map { |item| serialize(item) } }
        end

        def create
          item = scoped.create!(email: params.require(:email), reason: params.fetch(:reason, 'manual'))
          render json: { suppression: serialize(item) }, status: :created
        rescue ActiveRecord::RecordInvalid => e
          render json: { error: e.record.errors.full_messages.to_sentence, code: 'SUPPRESSION_INVALID' }, status: :unprocessable_entity
        end

        def destroy
          scoped.find(params[:id]).destroy!
          head :no_content
        end

        private

        def scoped
          ::Sales::EmailSuppression.where(company_id: current_user.company_id)
        end

        def serialize(item)
          { id: item.id, email: item.email, reason: item.reason, suppressed_at: item.suppressed_at }
        end
      end
    end
  end
end
