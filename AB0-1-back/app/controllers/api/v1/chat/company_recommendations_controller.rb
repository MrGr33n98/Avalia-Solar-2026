# frozen_string_literal: true

module Api
  module V1
    module Chat
      class CompanyRecommendationsController < BaseController
        before_action :validate_session, only: [:create]

        def create
          vertical = params[:vertical]
          answers = params[:answers] || {}
          session_id = params[:session_id]

          return render_json_error('Vertical inválida', :bad_request) unless valid_vertical?(vertical)

          service = Chat::CompanyRecommendationService.new(
            vertical: vertical,
            answers: answers,
            session_id: session_id
          )

          result = service.call

          track_event(vertical, answers, result)

          render json: {
            recommendations: result[:recommendations],
            fallback_reason: result[:fallback_reason],
            total: result[:total]
          }, status: :ok
        rescue StandardError => e
          Rails.logger.error("Erro ao buscar recomendações: #{e.message}")
          render_json_error('Erro ao buscar recomendações', :internal_server_error)
        end

        private

        def validate_session
          # Validação básica de sessão pode ser adicionada aqui
          # Por enquanto, permite sessão anônima para discovery
        end

        def valid_vertical?(vertical)
          %w[energia_solar mobilidade_eletrica].include?(vertical)
        end

        def track_event(vertical, answers, result)
          return unless defined?(PosthogTrackingService)

          PosthogTrackingService.track_event(
            event: 'mobivolt_company_recommendations_returned',
            properties: {
              session_id: params[:session_id],
              vertical: vertical,
              city_present: answers['city'].present? || answers['location_city'].present?,
              state_present: answers['state'].present? || answers['location_state'].present?,
              category_present: answers['category_or_need'].present? || answers['solution_type'].present?,
              recommendations_count: result[:total],
              has_fallback: result[:fallback_reason].present?
            }
          )
        end
      end
    end
  end
end
