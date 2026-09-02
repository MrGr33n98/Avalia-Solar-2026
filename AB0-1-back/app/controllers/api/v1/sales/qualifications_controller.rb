module Api
  module V1
    module Sales
      class QualificationsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        def show
          render json: { qualification: ::Sales::Qualification.find_by!(sales_opportunity_id: params[:opportunity_id]) }
        end
        def upsert
          qualification = ::Sales::Qualification.find_or_initialize_by(sales_opportunity_id: params[:opportunity_id])
          qualification.assign_attributes(qualification_params)
          qualification.save!
          render json: { qualification: qualification }
        end
        private

        def qualification_params
          params.require(:qualification).permit(:situation, :problem, :implication, :need_payoff, :budget, :authority, :need, :timeline, :spin_completion, :bant_completion)
        end
      end
    end
  end
end
