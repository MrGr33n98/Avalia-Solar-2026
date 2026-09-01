module Api
  module V1
    module Sales
      class OpportunitiesController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity, only: :update

        def create
          opportunity = ::Sales::Opportunity.new(opportunity_params.merge(owner: current_user))
          opportunity.probability = opportunity.stage.probability unless opportunity.probability_overridden?
          opportunity.stage_entered_at = Time.current
          opportunity.save!
          opportunity.stage_histories.create!(to_stage: opportunity.stage, actor: current_user, entered_at: Time.current)
          render json: { opportunity: opportunity_json(opportunity) }, status: :created
        end

        def update
          if params.dig(:opportunity, :stage_key).present? || params.dig(:opportunity, :sales_stage_id).present?
            stage = params[:opportunity][:stage_key].present? ? @opportunity.pipeline.stages.find_by!(key: params[:opportunity][:stage_key]) : ::Sales::Stage.find(params[:opportunity][:sales_stage_id])
            ::Sales::Opportunities::ChangeStage.call(opportunity: @opportunity, stage:, actor: current_user)
          else
            @opportunity.update!(opportunity_params)
          end
          render json: { opportunity: opportunity_json(@opportunity.reload) }
        end

        private

        def set_opportunity
          @opportunity = ::Sales::Opportunity.find(params[:id])
        end

        def require_internal_sales
          return if current_user&.admin?

          render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
        end

        def opportunity_params
          params.require(:opportunity).permit(:sales_account_id, :primary_contact_id, :sales_pipeline_id, :sales_stage_id,
                                              :name, :value_cents, :currency, :probability, :probability_overridden,
                                              :priority, :source, :expected_close_date, :next_activity_at)
        end

        def opportunity_json(opportunity)
          { id: opportunity.id, name: opportunity.name, value_cents: opportunity.value_cents,
            probability: opportunity.probability, status: opportunity.status, stage_id: opportunity.sales_stage_id,
            account_id: opportunity.sales_account_id, owner_id: opportunity.owner_id }
        end
      end
    end
  end
end
