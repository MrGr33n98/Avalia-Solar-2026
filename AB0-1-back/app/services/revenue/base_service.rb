# frozen_string_literal: true

module Revenue
  class BaseService
    private

    attr_reader :user, :arguments

    def initialize(user:, arguments: {})
      @user = user
      @arguments = (arguments || {}).to_h.with_indifferent_access
    end

    def tenant_scope
      unless user
        raise Mcp::Error.new(code: 'authentication_required', message: 'Contexto de usuário obrigatório.',
                             status: :unauthorized)
      end

      @tenant_scope ||= Sales::TenantScope.for(user)
    end

    def tenant_company_id!
      company_id = user.respond_to?(:company_id) ? user.company_id : nil
      return company_id if company_id.present?

      raise Mcp::Error.new(
        code: 'tenant_context_required',
        message: 'A operação de Revenue exige um tenant de empresa ativo.',
        status: :unprocessable_entity
      )
    end

    def tenant_company!
      Company.find(tenant_company_id!)
    end

    def find_account!(id = arguments[:account_id])
      tenant_scope.accounts.find(id)
    rescue ActiveRecord::RecordNotFound
      raise Mcp::Error.new(code: 'not_found', message: 'Conta não encontrada no tenant atual.', status: :not_found)
    end

    def find_opportunity!(id = arguments[:opportunity_id])
      tenant_scope.opportunities.find(id)
    rescue ActiveRecord::RecordNotFound
      raise Mcp::Error.new(code: 'not_found', message: 'Oportunidade não encontrada no tenant atual.',
                           status: :not_found)
    end

    def bounded_limit(default: 20, maximum: 100)
      arguments.fetch(:limit, default).to_i.clamp(1, maximum)
    end

    def required!(key)
      value = arguments[key]
      return value if value.present?

      raise Mcp::Error.new(code: 'invalid_params', message: "Informe #{key}.", status: :bad_request)
    end
  end
end
