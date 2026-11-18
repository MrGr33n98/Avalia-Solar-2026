# frozen_string_literal: true

module Mcp
  module Private
    class Executor
      TOOL_NAME = 'get_my_company_overview'

      def self.call(name:, user:, arguments:)
        raise InputError, 'Ferramenta privada desconhecida.' unless name == TOOL_NAME

        selector = arguments['company_id'] || arguments[:company_id]
        company = CompanyContext.resolve!(user: user, selector: selector)
        policy = CompanyPolicy.new(user, company)
        unless policy.mcp_read?
          raise Mcp::Error.new(code: 'forbidden', message: 'Acesso empresarial não autorizado.', status: :forbidden)
        end

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
