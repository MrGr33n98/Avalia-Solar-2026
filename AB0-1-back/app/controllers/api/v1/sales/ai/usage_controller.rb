# frozen_string_literal: true

module Api
  module V1
    module Sales
      module Ai
        class UsageController < BaseController
          # GET /api/v1/sales/ai/usage
          def index
            company_id = current_company_id
            return unless company_id

            setting = ::Sales::Ai::ModelProfileResolver.ensure_defaults_for_company!(company_id)
            scope = ::Sales::AiGeneration.for_company(company_id)
            month_scope = scope.current_month
            today_scope = scope.today

            completed_month = month_scope.where(status: %w[completed fallback_completed])
            failed_month = month_scope.where(status: 'failed')

            by_feature = completed_month.group(:feature).count
            by_model = completed_month.group(:resolved_model).count
            by_decision = completed_month.where.not(user_decision: nil).group(:user_decision).count

            user_today_count = today_scope.where(user_id: current_user.id, status: %w[completed fallback_completed]).count

            recent = scope.order(created_at: :desc).limit(25).map do |gen|
              {
                id: gen.id,
                generation_id: "gen_#{gen.id}",
                feature: gen.feature,
                action: gen.action_name,
                status: gen.status,
                requested_model: gen.requested_model,
                resolved_model: gen.resolved_model,
                fallback_used: gen.fallback_model_used.present?,
                prompt_tokens: gen.prompt_tokens,
                completion_tokens: gen.completion_tokens,
                estimated_cost_usd: gen.estimated_cost_usd.to_f.round(6),
                latency_ms: gen.latency_ms,
                user_decision: gen.user_decision,
                error_code: gen.error_code,
                created_at: gen.created_at&.iso8601
              }
            end

            render json: {
              summary: {
                monthly_budget_usd: setting.monthly_budget_usd.to_f,
                monthly_spent_usd: completed_month.sum(:estimated_cost_usd).to_f.round(4),
                monthly_generations: completed_month.count,
                monthly_failures: failed_month.count,
                monthly_prompt_tokens: completed_month.sum(:prompt_tokens),
                monthly_completion_tokens: completed_month.sum(:completion_tokens),
                avg_latency_ms: completed_month.average(:latency_ms)&.round || 0,
                daily_user_limit: setting.daily_user_limit,
                daily_user_used: user_today_count
              },
              by_feature: by_feature,
              by_model: by_model,
              by_decision: by_decision,
              recent_generations: recent
            }
          end
        end
      end
    end
  end
end

