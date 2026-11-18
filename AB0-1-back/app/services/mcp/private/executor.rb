# frozen_string_literal: true

module Mcp
  module Private
    class Executor
      TOOL_NAME = 'get_my_company_overview'

      def self.call(name:, user:, arguments:, auth_context:, remote_ip:)
        raise InputError, 'Ferramenta privada desconhecida.' unless name == TOOL_NAME

        selector = arguments['company_id'] || arguments[:company_id]
        company = CompanyContext.resolve!(user: user, selector: selector)
        policy = CompanyPolicy.new(user, company)
        unless policy.mcp_read?
          raise Mcp::Error.new(code: 'forbidden', message: 'Acesso empresarial não autorizado.', status: :forbidden)
        end

        # The tenant key is derived exclusively from a membership + Pundit-
        # authorized Company, never from arbitrary client-provided company_id.
        # The transport already enforces independent user/client/IP budgets.
        ::Mcp::RemoteQuotaPolicy.new(
          identity: auth_context.fetch(:subject),
          client_id: auth_context.fetch(:client_id),
          remote_ip: remote_ip,
          mode: :private,
          tenant_id: company.id.to_s
        ).enforce_tenant!

        { company: safe_company(company) }
      end

      def self.safe_company(company)
        {
          id: company.id, name: company.name, slug: company.slug, status: company.status,
          segment: company.segment, city: company.city, state: company.state,
          plan_tier: company.inferred_plan_tier
        }
      end
      private_class_method :safe_company

      class InputError < StandardError; end
    end
  end
end
