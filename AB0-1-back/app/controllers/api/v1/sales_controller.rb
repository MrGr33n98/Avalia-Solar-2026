module Api
  module V1
    class SalesController < BaseController
      before_action :authenticate_api_user
      before_action :require_internal_sales

      def index
        opportunities = ::Sales::Opportunity.includes(:account, :stage, :owner).open.order(created_at: :desc)
        render json: { opportunities: opportunities.map { |opportunity| opportunity_json(opportunity) } }
      end

      def summary
        opportunities = ::Sales::Opportunity.open
        total = opportunities.sum(:value_cents)
        weighted = opportunities.sum('value_cents * probability / 100.0').to_i
        render json: { pipeline_value_cents: total, weighted_pipeline_cents: weighted, deals_count: opportunities.count,
                       tasks_today: ::Sales::Task.where(owner: current_user).pending.where(due_at: Time.zone.today.all_day).count }
      end

      private

      def require_internal_sales
        return if current_user&.admin?

        render_error_response(message: 'CRM interno requer autorização de vendas.', status: :forbidden, code: 'SALES_FORBIDDEN')
      end

      def opportunity_json(opportunity)
        { id: opportunity.id, name: opportunity.name, value_cents: opportunity.value_cents,
          probability: opportunity.probability, status: opportunity.status,
          account: { id: opportunity.account.id, name: opportunity.account.name },
          stage: { id: opportunity.stage.id, key: opportunity.stage.key, name: opportunity.stage.name },
          owner_id: opportunity.owner_id, next_activity_at: opportunity.next_activity_at }
      end
    end
  end
end
