# frozen_string_literal: true

module Mcp
  class ApprovalPolicyService
    EXECUTION_EFFECT_TYPES = {
      database_mutation: 'DATABASE_MUTATION',
      outbox_mutation: 'OUTBOX_MUTATION',
      idempotent_external_mutation: 'IDEMPOTENT_EXTERNAL_MUTATION',
      non_idempotent_external_mutation: 'NON_IDEMPOTENT_EXTERNAL_MUTATION'
    }.freeze

    TOOL_EXECUTION_EFFECTS = {
      'search_companies' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'search_products' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'get_company_profile' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'compare_companies' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'get_reviews_summary' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'create_review_request' => EXECUTION_EFFECT_TYPES[:outbox_mutation],
      'get_company_dashboard_metrics' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'get_leads_summary' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'recommend_next_actions' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'get_market_snapshot' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'send_outbound_campaign' => EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation],
      'bulk_lead_export' => EXECUTION_EFFECT_TYPES[:idempotent_external_mutation],
      'publish_company_update' => EXECUTION_EFFECT_TYPES[:outbox_mutation],
      'charge_subscription' => EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation],
      'delete_tenant_data' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'grant_admin_role' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_register_prospect' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_record_qualification_assessment' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_create_internal_task' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_refresh_founder_inbox' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_prepare_campaign' => EXECUTION_EFFECT_TYPES[:database_mutation],
      'revenue_request_campaign_send' => EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation]
    }.freeze

    DEFAULT_TTLS = {
      'r0' => 1.hour,
      'r1' => 1.hour,
      'r2' => 2.hours,
      'r3' => 24.hours,
      'r4' => 4.hours
    }.freeze

    class << self
      def requires_approval?(tool_name:, arguments: {}, agent: nil, user: nil)
        return false if RiskClassifier.prohibited?(tool_name)
        return true if RiskClassifier.hitl_required?(tool_name, arguments)

        risk = RiskClassifier.risk_tier(tool_name).to_s.downcase
        return true if %w[r3 r4].include?(risk)

        false
      end

      def can_user_approve?(user:, approval_request:)
        return false unless user && approval_request
        return false if approval_request.requested_by_user_id.present? && approval_request.requested_by_user_id == user.id

        return true if user.admin?

        risk = approval_request.risk_tier.to_s.downcase
        if risk == 'r4'
          can_user_review_critical?(user: user, approval_request: approval_request)
        else
          has_capability?(user, 'mcp.approvals.review') || has_capability?(user, 'mcp.approvals.critical')
        end
      end

      def can_user_review_critical?(user:, approval_request: nil)
        return false unless user
        return true if user.admin?

        has_capability?(user, 'mcp.approvals.critical')
      end

      def who_can_approve(approval_request)
        risk = approval_request.risk_tier.to_s.downcase
        if risk == 'r4'
          'Administradores ou operadores com capability mcp.approvals.critical (proibida auto-aprovação)'
        else
          'Administradores ou operadores com capability mcp.approvals.review (proibida auto-aprovação)'
        end
      end

      def approval_ttl(risk_tier:)
        DEFAULT_TTLS.fetch(risk_tier.to_s.downcase, 1.hour)
      end

      def execution_policy(tool_name:)
        effect = TOOL_EXECUTION_EFFECTS[tool_name.to_s] || EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation]
        idempotency_proven = [
          EXECUTION_EFFECT_TYPES[:database_mutation],
          EXECUTION_EFFECT_TYPES[:outbox_mutation],
          EXECUTION_EFFECT_TYPES[:idempotent_external_mutation]
        ].include?(effect)

        {
          tool_name: tool_name.to_s,
          effect_type: effect,
          idempotency_proven: idempotency_proven,
          async_execution_recommended: effect == EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation] || effect == EXECUTION_EFFECT_TYPES[:outbox_mutation],
          retry_strategy: effect == EXECUTION_EFFECT_TYPES[:non_idempotent_external_mutation] ? 'manual_intervention_required' : 'safe_retryable'
        }
      end

      def risk_policy(risk_tier:)
        tier = risk_tier.to_s.downcase
        case tier
        when 'r0'
          {
            tier: 'R0',
            level: 'Safe Read',
            hitl_default: false,
            approver_requirement: 'none',
            auto_executable: true
          }
        when 'r1'
          {
            tier: 'R1',
            level: 'Analysis & Draft',
            hitl_default: false,
            approver_requirement: 'none',
            auto_executable: true
          }
        when 'r2'
          {
            tier: 'R2',
            level: 'Internal Low-Risk Write',
            hitl_default: false,
            approver_requirement: 'mcp.approvals.review',
            auto_executable: true
          }
        when 'r3'
          {
            tier: 'R3',
            level: 'External Mutation',
            hitl_default: true,
            approver_requirement: 'mcp.approvals.review',
            auto_executable: false
          }
        when 'r4'
          {
            tier: 'R4',
            level: 'Critical / Financial / Destructive',
            hitl_default: true,
            approver_requirement: 'mcp.approvals.critical',
            auto_executable: false
          }
        else
          {
            tier: 'UNKNOWN',
            level: 'Strict High Risk (Fallback)',
            hitl_default: true,
            approver_requirement: 'mcp.approvals.critical',
            auto_executable: false
          }
        end
      end

      private

      def has_capability?(user, capability)
        return true if user.admin?
        return true if user.respond_to?(:has_role?) && user.has_role?(:admin)
        return true if user.respond_to?(:has_permission?) && user.has_permission?(capability.tr('.', '_').to_sym)
        return true if defined?(::Sales::AuthorizationService) && ::Sales::AuthorizationService.can?(user: user, permission: capability)

        false
      end
    end
  end
end
