# frozen_string_literal: true

module Mcp
  module Private
    class CompanyPolicy < ::ApplicationPolicy
      REQUIRED_ENTITLEMENT = 'advanced_analytics'

      def mcp_read?
        return false unless user.is_a?(::User) && user.active_for_authentication?
        return false unless record&.status == 'active'
        return false unless active_membership.present?

        ::EntitlementService.entitled?(company: record, feature: REQUIRED_ENTITLEMENT)
      rescue StandardError => e
        Rails.logger.warn("[MCP Private Policy] entitlement check failed class=#{e.class}")
        false
      end

      private

      def active_membership
        user.company_members.active.find_by(company_id: record.id)
      end
    end
  end
end
