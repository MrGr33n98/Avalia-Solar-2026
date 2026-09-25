module Api
  module V1
    module Sales
      class QualificationsController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        def show
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          render json: { qualification: ::Sales::Qualification.find_by(sales_opportunity_id: opportunity.id) }
        end
        def upsert
          opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
          qualification = ::Sales::Qualification.find_or_initialize_by(sales_opportunity_id: opportunity.id)
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
