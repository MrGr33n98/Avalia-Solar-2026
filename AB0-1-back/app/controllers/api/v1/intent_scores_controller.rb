module Api
  module V1
    class IntentScoresController < BaseController
      include FeatureGateEnforceable

      before_action :authenticate_api_user, except: []
      before_action :set_company_for_intent_scores
      before_action :authorize_intent_scores_company!
      before_action :enforce_intent_scores_access!

      # GET /api/v1/intent_scores
      # Get ranked intent scores for a company with G2 ICP filter support
      def index
        company_id = params[:company_id]

        return render json: { error: 'company_id required' }, status: :bad_request if company_id.blank?

        scope = IntentScore.where(company_id: company_id)
                           .includes(:lead_record, :company)

        # Filtro de Estágio de Compra (Buying Stage)
        if params[:buying_stage].present?
          case params[:buying_stage].to_s.downcase
          when 'decision'
            scope = scope.where(intent_level: %w[boiling immediate declared])
          when 'consideration'
            scope = scope.where(intent_level: %w[warm hot])
          when 'awareness'
            scope = scope.where(intent_level: 'cold')
          end
        end

        # Filtro de Nível de Atividade (Activity Level)
        if params[:activity_level].present?
          case params[:activity_level].to_s.downcase
          when 'high'
            scope = scope.where('total_score >= 71 OR hot_signals_count >= 3')
          when 'medium'
            scope = scope.where('total_score BETWEEN 31 AND 70')
          when 'low'
            scope = scope.where('total_score <= 30')
          end
        end

        # Filtro de Data
        if params[:days].present?
          scope = scope.where('last_interaction_at >= ?', params[:days].to_i.days.ago)
        end

        limit = params[:limit].present? ? [params[:limit].to_i, 100].min : 50
        offset = params[:offset].to_i

        total_count = scope.count
        scores = scope.by_score.offset(offset).limit(limit)

        render json: {
          total: total_count,
          limit: limit,
          offset: offset,
          scores: scores.map { |s| score_json(s) }
        }
      end

      # GET /api/v1/intent_scores/reporting
      # G2 Buyer Intent Reporting panel (Buying Stage & Activity Level distributions)
      def reporting
        company_id = params[:company_id]
        scope = IntentScore.where(company_id: company_id)

        total_accounts = scope.count
        scores_array = scope.limit(200).to_a

        stage_dist = {
          awareness: scope.where(intent_level: 'cold').count,
          consideration: scope.where(intent_level: %w[warm hot]).count,
          decision: scope.where(intent_level: %w[boiling immediate declared]).count
        }

        activity_dist = {
          low: scope.where('total_score <= 30').count,
          medium: scope.where('total_score BETWEEN 31 AND 70').count,
          high: scope.where('total_score >= 71 OR hot_signals_count >= 3').count
        }

        direct_views = scores_array.sum(&:direct_pageviews)
        competitive_views = scores_array.sum(&:competitive_pageviews)

        profile_count = scores_array.sum do |s|
          counts = s.score_breakdown.is_a?(Hash) ? (s.score_breakdown.dig('signal_counts', 'by_type') || {}) : {}
          counts['profile_view'].to_i + counts['review_read'].to_i + counts['faq_interaction'].to_i
        end

        pricing_count = scores_array.sum do |s|
          counts = s.score_breakdown.is_a?(Hash) ? (s.score_breakdown.dig('signal_counts', 'by_type') || {}) : {}
          counts['pricing_interaction'].to_i + counts['calculator_usage'].to_i
        end

        compare_count = competitive_views
        contact_count = scores_array.sum { |s| s.hot_signals_count.to_i }

        render json: {
          total_accounts: total_accounts,
          buying_stage_distribution: stage_dist,
          activity_level_distribution: activity_dist,
          traffic_ratio: {
            direct_pageviews: direct_views,
            competitive_pageviews: competitive_views,
            total_intent_signals: scores_array.sum(&:total_signals_count)
          },
          top_signals_summary: [
            { type: 'profile', label: 'Visualizações de Perfil', count: profile_count },
            { type: 'pricing', label: 'Simulador / Preços', count: pricing_count },
            { type: 'compare', label: 'Comparador Solar', count: compare_count },
            { type: 'contact', label: 'Cliques WhatsApp / Fone', count: contact_count }
          ]
        }
      end

      # GET /api/v1/intent_scores/export_csv
      # Export G2 Summary CSV
      def export_csv
        require 'csv'
        company_id = params[:company_id]
        scores = IntentScore.where(company_id: company_id).by_score.includes(:lead_record, :company).limit(500)

        csv_data = CSV.generate(headers: true) do |csv|
          csv << [
            'ID da Conta',
            'Organizacao Compradora',
            'Estagio de Compra (Buying Stage)',
            'Nivel de Atividade (Activity Level)',
            'Score Total (0-100)',
            'Visualizacoes Diretas',
            'Visualizacoes Competitivas',
            'Total de Sinais',
            'Sinais Quentes',
            'Ultimo Sinal'
          ]

          scores.each do |s|
            lead_name = s.lead_record&.name.presence || "Conta em Pesquisa ##{s.id.to_s[0..7]}"
            csv << [
              s.id,
              lead_name,
              s.buying_stage.capitalize,
              s.activity_level.capitalize,
              s.total_score,
              s.direct_pageviews,
              s.competitive_pageviews,
              s.total_signals_count,
              s.hot_signals_count,
              s.last_interaction_at&.strftime('%Y-%m-%d %H:%M:%S')
            ]
          end
        end

        send_data csv_data, filename: "g2-buyer-intent-summary-#{company_id}-#{Date.current}.csv", type: 'text/csv'
      end

      # GET /api/v1/intent_scores/export_detail_csv
      # Export G2 Signal Detail CSV
      def export_detail_csv
        require 'csv'
        company_id = params[:company_id]
        activities = BuyerIntentActivity.where(company_id: company_id).order(tracked_at: :desc).limit(1000)

        csv_data = CSV.generate(headers: true) do |csv|
          csv << [
            'Signal ID',
            'Tipo de Sinal',
            'Categoria',
            'Peso de Intencao',
            'Sessao / Conta',
            'Pagina / Recurso',
            'Dispositivo',
            'Data e Hora'
          ]

          activities.each do |act|
            sig_type = act.signal_type.include?('compare') ? "competitive/#{act.signal_type}" : act.signal_type
            csv << [
              act.id,
              sig_type,
              act.signal_category,
              act.intent_weight,
              act.anonymous_id.presence || act.session_id,
              act.page_path,
              act.device_type,
              act.tracked_at.strftime('%Y-%m-%d %H:%M:%S')
            ]
          end
        end

        send_data csv_data, filename: "g2-buyer-intent-detail-#{company_id}-#{Date.current}.csv", type: 'text/csv'
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
        score = @company.intent_scores.find(params[:id])

        render json: score_json(score, detailed: true)
      end

      # POST /api/v1/intent_scores/recalculate
      # Trigger recalculation for a company
      def recalculate
        company_id = params[:company_id]
        lead_id = params[:lead_id]
        anonymous_id = params[:anonymous_id]

        return render json: { error: 'company_id required' }, status: :bad_request if company_id.blank?

        CalculateBuyerIntentJob.perform_later(
          company_id,
          lead_id: lead_id,
          anonymous_id: anonymous_id
        )

        render json: { status: 'scheduled' }
      end

      private

      def set_company_for_intent_scores
        if params[:id].present?
          score = IntentScore.find_by(id: params[:id])
          unless score
            render json: { error: 'Score not found' }, status: :not_found
            return
          end

          if params[:company_id].present? && params[:company_id].to_s != score.company_id.to_s
            render json: { error: 'Acesso negado para este recurso' }, status: :forbidden
            return
          end

          @company = score.company
        else
          company_id = params[:company_id].presence
          if company_id.blank?
            render json: { error: 'company_id required' }, status: :bad_request
            return
          end

          @company = ::Company.find(company_id)
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Company not found' }, status: :not_found
      end

      def authorize_intent_scores_company!
        return if performed?

        authorize @company, :show?
      end

      def enforce_intent_scores_access!
        return if performed?

        enforce_feature_access!(:intent_scores, company: @company)
      end

      def score_json(score, detailed: false)
        lead = score.lead_record
        lead_name = lead&.name.presence || "Conta Corporativa / Anônima ##{score.id.to_s[0..7]}"
        location = if lead&.city.present? && lead&.state.present?
                     "#{lead.city}, #{lead.state}"
                   else
                     "Brasil (Sinal de Rede)"
                   end

        base = {
          id: score.id,
          company_id: score.company_id,
          company_name: score.company&.name,
          lead_id: score.lead_id,
          anonymous_id: score.anonymous_id,
          account_name: lead_name,
          location: location,
          buying_stage: score.buying_stage,
          activity_level: score.activity_level,
          total_score: score.total_score,
          direct_pageviews: score.direct_pageviews,
          competitive_pageviews: score.competitive_pageviews,
          unique_visitors: score.unique_sessions_count.to_i,
          intent_level: score.intent_level,
          thermometer: score.thermometer_emoji,
          recommended_action: score.recommended_action,
          sla_window: score.sla_window,
          last_interaction_at: score.last_interaction_at,
          confidence_score: score.confidence_score,
          signals_count: score.total_signals_count.to_i,
          hot_signals_count: score.hot_signals_count.to_i
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
