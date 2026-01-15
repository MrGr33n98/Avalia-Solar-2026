module Api
  module V1
    module Company
      class PendingChangesController < Api::V1::BaseController
        before_action :authenticate_api_user
        before_action :require_company_user
        before_action :set_company

        def index
          items = @company.pending_changes.order(created_at: :desc)
          render json: {
            items: items.map { |pc| serialize(pc) },
            count: items.size
          }
        end

        def show
          pc = @company.pending_changes.find(params[:id])
          render json: serialize(pc)
        end

        private

        def set_company
          @company = current_user.company
          render_error('Company not found', :not_found) unless @company
        end

        def serialize(pc)
          {
            id: pc.id,
            change_type: pc.change_type,
            status: pc.status,
            data: pc.data,
            created_at: pc.created_at,
            updated_at: pc.updated_at
          }
        end
      end
    end
  end
end
