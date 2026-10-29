# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Ai
        class GenerationsController < BaseController
          # POST /api/v1/sales/ai/generations
          def create
            company_id = current_company_id
            return unless company_id

            result = ::Sales::Ai::Gateway.generate!(
              user: current_user,
              tenant_scope: current_tenant_scope,
              params: generation_params
            )

            render json: result, status: :ok
          rescue ::Sales::Ai::Gateway::GenerationError => e
            render_error_response(
              message: e.message,
              status: e.http_status,
              code: e.code
            )
          end

          # GET /api/v1/sales/ai/generations/:id
          def show
            company_id = current_company_id
            return unless company_id

            gen_id = params[:id].to_s.sub(/\Agen_/, '')
            generation = ::Sales::AiGeneration.for_company(company_id).find(gen_id)

            render json: ::Sales::Ai::Gateway.format_generation(generation)
          end

          # POST /api/v1/sales/ai/generations/:id/feedback
          def feedback
            company_id = current_company_id
            return unless company_id

            gen_id = params[:id].to_s.sub(/\Agen_/, '')
            generation = ::Sales::AiGeneration.for_company(company_id).find(gen_id)

            decision = params[:decision].to_s.strip
            unless ::Sales::AiGeneration::USER_DECISIONS.include?(decision)
              return render_error_response(
                message: "Decisão inválida. Valores aceitos: #{::Sales::AiGeneration::USER_DECISIONS.join(', ')}.",
                status: :unprocessable_entity,
                code: 'INVALID_DECISION'
              )
            end

            generation.update!(
              user_decision: decision,
              user_feedback_notes: params[:notes].to_s.truncate(500).presence
            )

            if defined?(Analytics::PostHogService)
              begin
                Analytics::PostHogService.capture(
                  user_id: current_user.id,
                  event: "crm_ai_suggestion_#{decision}",
                  properties: {
                    company_id: company_id,
                    generation_id: generation.id,
                    feature: generation.feature,
                    resolved_model: generation.resolved_model
                  }
                )
              rescue StandardError
                nil
              end
            end

            render json: {
              message: 'Decisão registrada com sucesso.',
              generation: ::Sales::Ai::Gateway.format_generation(generation)
            }
          end

          private

          def generation_params
            {
              feature: params[:feature],
              action: params[:action_name].presence || request.request_parameters['action'] || params[:feature],
              idempotency_key: params[:idempotency_key] || request.headers['X-Idempotency-Key'],
              instructions: params[:instructions],
              context: permit_hash(params[:context]),
              draft: permit_hash(params[:draft]),
              options: permit_hash(params[:options])
            }
          end

          def permit_hash(raw)
            return {} unless raw.respond_to?(:to_unsafe_h) || raw.is_a?(Hash)

            raw.respond_to?(:to_unsafe_h) ? raw.to_unsafe_h : raw
          end
        end
      end
    end
  end
end

