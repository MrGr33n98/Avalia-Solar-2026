# frozen_string_literal: true

module Mcp
  class Error < StandardError
    attr_reader :code, :status, :details

    def initialize(code:, message:, status: :unprocessable_entity, details: nil)
      super(message)
      @code = code
      @status = status
      @details = details
    end
  end

  class BaseService
    DEFAULT_LIMIT = 10
    MAX_LIMIT = 20

    def initialize(arguments:, user: nil)
      @arguments = (arguments || {}).to_h.with_indifferent_access
      @user = user
    end

    private

    attr_reader :arguments, :user

    def limit
      arguments.fetch(:limit, DEFAULT_LIMIT).to_i.clamp(1, MAX_LIMIT)
    end

    def required!(key, message = nil)
      value = arguments[key]
      return value if value.present?

      raise Error.new(code: 'invalid_params', message: message || "Informe #{key}.")
    end

    def find_company!(value = arguments[:company_id] || arguments[:slug], scope: Company.all)
      required_company = value.presence || required!(:company_id, 'Informe a empresa.')
      company = required_company.to_s.match?(/\A\d+\z/) ? scope.find_by(id: required_company) : scope.find_by(slug: required_company)
      company || raise(Error.new(code: 'not_found', message: 'Empresa não encontrada.', status: :not_found))
    end

    def public_company(company)
      {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        logo_url: company.logo_url,
        city: company.city,
        state: company.state,
        verified: !!company.verified,
        rating: company.rating_avg.to_f,
        reviews_count: (company.rating_count.presence || company.reviews_count).to_i,
        categories: company.categories.map { |category| { id: category.id, name: category.name } },
        services: Array(company.services_offered),
        profile_url: "/companies/#{company.slug}"
      }
    end

    def active_companies
      Company.where(status: 'active')
    end

    def authorized_company!
      raise Error.new(code: 'authentication_required', message: 'Autenticação obrigatória.', status: :unauthorized) unless user

      requested_id = arguments[:company_id].presence
      if requested_id && !user.admin? && !user.active_membership_for?(requested_id)
        raise Error.new(code: 'forbidden', message: 'Acesso à empresa não autorizado.', status: :forbidden)
      end

      company = requested_id ? Company.find_by(id: requested_id) : user.current_company

      company || raise(Error.new(code: 'forbidden', message: 'Acesso à empresa não autorizado.', status: :forbidden))
    end

    def period_days
      arguments.fetch(:days, 30).to_i.clamp(1, 365)
    end
  end
end
