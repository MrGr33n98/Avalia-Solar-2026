module Api
  module V1
    module Sales
      class ClosuresController < BaseController
        LOST_REASONS = %w[lost_to_competitor price_terms project_cancelled no_response other].freeze

        before_action :authenticate_api_user
        before_action :require_internal_sales
        before_action :set_opportunity

        def won
          ::Sales::Opportunity.transaction do
            @opportunity.update!(status: 'won', won_at: Time.current, probability: 100)
            publish_event('sales.opportunity.won')
          end
          render json: { opportunity: payload }
        end

        def lost
          reason = params.require(:lost_reason).to_s
          unless LOST_REASONS.include?(reason)
            return render_error_response(message: 'Motivo de perda inválido.', status: :unprocessable_entity,
                                         code: 'INVALID_LOST_REASON')
          end

          competitor = resolve_lost_competitor(reason)
          return if performed?

          ::Sales::Opportunity.transaction do
            @opportunity.update!(status: 'lost', lost_at: Time.current, lost_reason: reason,
                                 lost_notes: params[:lost_notes], probability: 0,
                                 metadata: lost_metadata(reason, competitor))
            @opportunity.opportunity_competitors.find_or_create_by!(competitor: competitor) if competitor
            publish_event('sales.opportunity.lost', competitor_id: competitor&.id, lost_reason: reason)
          end
          render json: { opportunity: payload }
        end

        private

        def set_opportunity
          @opportunity = current_tenant_scope.opportunities.find(params[:opportunity_id])
        end

        def resolve_lost_competitor(reason)
          if reason == 'lost_to_competitor' && params[:competitor_id].blank?
            render_error_response(message: 'Concorrente é obrigatório para este motivo.',
                                  status: :unprocessable_entity, code: 'COMPETITOR_REQUIRED')
            return nil
          end

          return nil if params[:competitor_id].blank?

          ::Sales::Competitor.active.find(params[:competitor_id])
        end

        def lost_metadata(reason, competitor)
          metadata = (@opportunity.metadata || {}).except('lost_competitor_id')
          metadata['lost_category'] = reason
          metadata['lost_competitor_id'] = competitor.id if competitor
          metadata
        end

        def publish_event(event_type, details = {})
          Outbox.record!(
            event_type: event_type,
            aggregate: @opportunity,
            payload: { opportunity_id: @opportunity.id, actor_id: current_user.id }.merge(details.compact)
          )
        end

        def payload
          competitor_id = @opportunity.metadata&.fetch('lost_competitor_id', nil)
          competitor = ::Sales::Competitor.find_by(id: competitor_id)
          { id: @opportunity.id, status: @opportunity.status, probability: @opportunity.probability,
            won_at: @opportunity.won_at, lost_at: @opportunity.lost_at,
            lost_reason: @opportunity.lost_reason, lost_notes: @opportunity.lost_notes,
            lost_competitor: competitor ? { id: competitor.id, name: competitor.name } : nil }
        end
      end
    end
  end
end
