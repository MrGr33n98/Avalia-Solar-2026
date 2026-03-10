module Api
  module V1
    class IntentScoresController < BaseController
      before_action :authenticate_api_user, except: []

      # GET /api/v1/intent_scores
      # Get ranked intent scores for a company
      def index
        company_id = params[:company_id]
        
        if company_id.blank?
          return render json: { error: 'company_id required' }, status: :bad_request
        end
        
        scores = IntentScore.where(company_id: company_id)
                           .by_score
                           .includes(:lead, :company)
                           .limit(100)
        
        render json: {
          total: scores.size,
          scores: scores.map { |s| score_json(s) }
        }
      end

      # GET /api/v1/intent_scores/summary
      # Get breakdown by intent level
      def summary
        company_id = params[:company_id]
        
        scope = company_id.present? ? IntentScore.where(company_id: company_id) : IntentScore.all
        
        breakdown = {
          cold: scope.cold.count,
          warm: scope.warm.count,
          hot: scope.hot.count,
          boiling: scope.boiling.count,
          immediate: scope.immediate.count,
          declared: scope.declared.count
        }
        
        actionable = scope.actionable.by_score.limit(20)
        
        render json: {
          breakdown: breakdown,
          total: scope.count,
          actionable_count: breakdown.values_at(:hot, :boiling, :immediate, :declared).sum,
          top_actionable: actionable.map { |s| score_json(s) }
        }
      end

      # GET /api/v1/intent_scores/:id
      # Get single score with full details
      def show
        score = IntentScore.find(params[:id])
        
        render json: score_json(score, detailed: true)
      end

      # POST /api/v1/intent_scores/recalculate
      # Trigger recalculation for a company
      def recalculate
        company_id = params[:company_id]
        lead_id = params[:lead_id]
        anonymous_id = params[:anonymous_id]
        
        if company_id.blank?
          return render json: { error: 'company_id required' }, status: :bad_request
        end
        
        CalculateBuyerIntentJob.perform_later(
          company_id,
          lead_id: lead_id,
          anonymous_id: anonymous_id
        )
        
        render json: { status: 'scheduled' }
      end

      private

      def score_json(score, detailed: false)
        base = {
          id: score.id,
          company_id: score.company_id,
          company_name: score.company&.name,
          lead_id: score.lead_id,
          anonymous_id: score.anonymous_id,
          total_score: score.total_score,
          intent_level: score.intent_level,
          thermometer: score.thermometer_emoji,
          recommended_action: score.recommended_action,
          sla_window: score.sla_window,
          last_interaction_at: score.last_interaction_at,
          confidence_score: score.confidence_score
        }
        
        if detailed
          base.merge!(
            category_scores: {
              micro_interaction: score.micro_interaction_score,
              research_intent: score.research_intent_score,
              financial_intent: score.financial_intent_score,
              contact_intent: score.contact_intent_score
            },
            signals: {
              total: score.total_signals_count,
              hot: score.hot_signals_count,
              sessions: score.unique_sessions_count,
              pages: score.unique_pages_count,
              days_active: score.days_active
            },
            decay_factor: score.decay_factor,
            score_breakdown: score.score_breakdown,
            top_signals: score.top_signals,
            history: score.histories.recent.limit(10).map do |h|
              {
                score_before: h.score_before,
                score_after: h.score_after,
                level_before: h.level_before,
                level_after: h.level_after,
                created_at: h.created_at
              }
            end
          )
        end
        
        base
      end
    end
  end
end
