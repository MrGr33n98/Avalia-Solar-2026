# frozen_string_literal: true

module CompanyAi
  # The public feature is denied unless *all* server-controlled conditions pass.
  # This does not approve specific workflow actions; those require independent gates.
  class FeatureGate
    Result = Struct.new(:allowed, :reason, keyword_init: true) do
      def allowed?
        allowed == true
      end
    end

    def self.call(company:, require_rollout: true)
      return deny('FEATURE_DISABLED') if require_rollout && ENV.fetch('COMPANY_AI_ENABLED', 'false') != 'true'
      return deny('COMPANY_NOT_FOUND') unless company
      return deny('COMPANY_INACTIVE') unless company.status.to_s == 'active'
      return deny('PAID_PLAN_REQUIRED') unless company.has_paid_plan?
      return deny('ENTITLEMENT_REQUIRED') unless company.feature_enabled_from_plan?('company_ai_assistant')

      Result.new(allowed: true, reason: 'AVAILABLE')
    rescue StandardError => e
      Rails.logger.warn("[CompanyAi::FeatureGate] fail_closed error=#{e.class}")
      deny('CONFIGURATION_ERROR')
    end

    def self.deny(reason)
      Result.new(allowed: false, reason: reason)
    end
    private_class_method :deny
  end
end
