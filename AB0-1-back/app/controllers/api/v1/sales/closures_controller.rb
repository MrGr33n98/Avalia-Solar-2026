module Api
  module V1
    module Sales
      class ClosuresController < BaseController
        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity

        def won
          @opportunity.update!(status: 'won', won_at: Time.current, probability: 100)
          publish_event('sales.opportunity.won')
          render json: { opportunity: payload }
        end

        def lost
          reason = params.require(:lost_reason)
          @opportunity.update!(status: 'lost', lost_at: Time.current, lost_reason: reason, lost_notes: params[:lost_notes], probability: 0)
          publish_event('sales.opportunity.lost')
          render json: { opportunity: payload }
        end

        private

        def set_opportunity
          @opportunity = ::Sales::Opportunity.find(params[:opportunity_id])
        end



        def publish_event(event_type)
          DomainEvent.create!(event_type:, aggregate_type: @opportunity.class.name, aggregate_id: @opportunity.id, occurred_at: Time.current, payload: { opportunity_id: @opportunity.id, actor_id: current_user.id })
        end

        def payload
          { id: @opportunity.id, status: @opportunity.status, probability: @opportunity.probability,
            won_at: @opportunity.won_at, lost_at: @opportunity.lost_at, lost_reason: @opportunity.lost_reason }
        end
      end
    end
  end
end
