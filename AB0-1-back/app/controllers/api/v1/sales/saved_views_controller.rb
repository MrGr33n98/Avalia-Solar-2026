module Api
  module V1
    module Sales
      class SavedViewsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales

        def index
          views = ::Sales::SavedView.for_user(current_user.id).order(created_at: :asc)
          render json: { saved_views: views }
        end

        def create
          view = ::Sales::SavedView.create!(
            user_id: current_user.id,
            name: view_params[:name],
            resource_type: view_params[:resource_type] || 'account',
            filters: view_params[:filters] || {},
            sort: view_params[:sort] || {},
            columns: view_params[:columns] || [],
            is_shared: view_params[:is_shared] || false
          )
          render json: { saved_view: view }, status: :created
        end

        def update
          view = ::Sales::SavedView.for_user(current_user.id).find(params[:id])
          view.update!(view_params)
          render json: { saved_view: view }
        end

        def destroy
          view = ::Sales::SavedView.for_user(current_user.id).find(params[:id])
          view.destroy!
          render json: { message: 'Visão salva removida.' }
        end

        private

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def view_params
          params.require(:saved_view).permit(:name, :resource_type, :is_shared, :is_default, filters: {}, sort: {}, columns: [])
        end
      end
    end
  end
end
