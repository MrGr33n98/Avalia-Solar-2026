module Sales
  module Ai
    class BudgetLimiter
      class QuotaExceededError < StandardError
        attr_reader :code, :http_status

        def initialize(message, code: 'AI_QUOTA_EXCEEDED', http_status: :too_many_requests)
          super(message)
          @code = code
          @http_status = http_status
        end
      end

      def self.check!(setting:, profile:, user:)
        new(setting: setting, profile: profile, user: user).check!
      end

      def initialize(setting:, profile:, user:)
        @setting = setting
        @profile = profile
        @user = user
      end

      def check!
        check_tenant_enabled!
        check_monthly_budget!
        check_user_daily_limit!
        check_feature_daily_quota!
      end

      private

      def check_tenant_enabled!
        return if @setting.enabled?

        raise QuotaExceededError.new(
          'O módulo de IA do CRM está desativado nas configurações desta empresa.',
          code: 'AI_DISABLED',
          http_status: :forbidden
        )
      end

      def check_monthly_budget!
        budget = @setting.monthly_budget_usd.to_d
        return if budget <= 0

        spent = Sales::AiGeneration.for_company(@setting.company_id)
                                   .current_month
                                   .where(status: %w[completed fallback_completed])
                                   .sum(:estimated_cost_usd).to_d

        return if spent < budget

        raise QuotaExceededError.new(
          format('Orçamento mensal de IA atingido ($%.2f / $%.2f USD). Contate o administrador do CRM.', spent, budget),
          code: 'AI_BUDGET_EXCEEDED',
          http_status: :too_many_requests
        )
      end

      def check_user_daily_limit!
        limit = @setting.daily_user_limit.to_i
        return if limit <= 0 || @user.blank?

        used = Sales::AiGeneration.where(company_id: @setting.company_id, user_id: @user.id)
                                  .today
                                  .where(status: %w[completed fallback_completed])
                                  .count

        return if used < limit

        raise QuotaExceededError.new(
          "Limite diário por usuário atingido (#{used}/#{limit} gerações hoje).",
          code: 'AI_QUOTA_EXCEEDED',
          http_status: :too_many_requests
        )
      end

      def check_feature_daily_quota!
        return if @profile.blank?

        quota = @profile.quota_daily.to_i
        return if quota <= 0

        used = Sales::AiGeneration.for_company(@setting.company_id)
                                  .by_feature(@profile.feature)
                                  .today
                                  .where(status: %w[completed fallback_completed])
                                  .count

        return if used < quota

        raise QuotaExceededError.new(
          "Cota diária para a tarefa '#{@profile.feature}' atingida (#{used}/#{quota}).",
          code: 'AI_FEATURE_QUOTA_EXCEEDED',
          http_status: :too_many_requests
        )
      end
    end
  end
end

