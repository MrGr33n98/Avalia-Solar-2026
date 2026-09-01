module Api
  module V1
    module Sales
      class ActivitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        def index
          account_id = params[:account_id] || params[:sales_account_id]
          activities = ::Sales::Activity.where(sales_account_id: account_id).order(occurred_at: :desc).limit(100)
          render json: { activities: activities }
        end
        def create
          account_id = params[:account_id] || params[:sales_account_id] || activity_params[:sales_account_id]
          activity = ::Sales::Activity.new(activity_params.merge(sales_account_id: account_id, actor: current_user, occurred_at: Time.current))
          activity.save!
          render json: { activity: activity }, status: :created
        end
        private
        def require_internal_sales
          return if current_user&.admin?
          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end
        def activity_params
          params.require(:activity).permit(:sales_opportunity_id, :sales_contact_id, :activity_type, :direction, :subject, :body)
        end
      end
    end
  end
end
