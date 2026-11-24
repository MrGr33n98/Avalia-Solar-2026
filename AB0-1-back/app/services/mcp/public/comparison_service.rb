# frozen_string_literal: true

module Mcp
  module Public
    # Objective comparison of 2–3 published companies. The matrix contains
    # only explicit public properties; sponsored placement is never a score.
    class ComparisonService
      PROFILE_ORIGIN = 'https://www.avaliasolar.com.br'

      def call(arguments:)
        args = InputValidator.normalize('compare_integrators', arguments)
        references = args.fetch('company_ids')
        companies = references.map do |reference|
          scope = Company.active.includes(:categories)
          row = reference.is_a?(Integer) ? scope.find_by(id: reference) : scope.find_by(slug: reference)
          raise DirectoryService::NotFound, 'Company not found.' unless row

          row
        end
        raise InputValidator::Invalid, 'Duplicate company.' unless companies.map(&:id).uniq.length == companies.length

        criteria = args.fetch('criteria')
        matrix = {}
        missing = []
        criteria.each do |criterion|
          matrix[criterion] = companies.each_with_object({}) do |company, result|
            value = field_value(criterion, company)
            result[company.id.to_s] = value
            missing << "#{company.id}:#{criterion}" if value.nil? ||
              (value.is_a?(Hash) && value.values.all? { |v| v.nil? || v.respond_to?(:empty?) && v.empty? }) ||
              (value.is_a?(Array) && value.empty?)
          end
        end

        {
          schema_version: Mcp::PublicToolRegistry::CONTRACT_VERSION,
          data_as_of: Time.current.utc.iso8601,
          source_type: 'platform_derived',
          data: {
            companies: companies.map do |company|
              {
                id: company.id, name: company.name, slug: company.slug,
                profile_url: "#{PROFILE_ORIGIN}/companies/#{company.slug}",
                logo_url: safe_logo_url(company),
                verification_state: company.verified? ? 'platform_verified' : 'unverified'
              }
            end,
            comparison_matrix: matrix, unknown_fields: missing.uniq,
            criteria_used: criteria
          },
          limitations: [
            'Comparação informativa; não identifica melhor empresa ou vencedor absoluto.',
            'Patrocínio não influencia esta matriz.',
            'Ausência de evidência é desconhecida, não resposta negativa.'
          ]
        }
      end

      private

      def safe_logo_url(company)
        url = company.logo_url.to_s.strip
        url.start_with?('https://') ? url : nil
      rescue StandardError
        nil
      end

      def field_value(criterion, company)
        case criterion
        when 'reputation'
          reviews = Review.approved_only.where(company_id: company.id)
          total = reviews.count
          {
            total_approved: total,
            average_rating: total.positive? ? reviews.average(:rating)&.to_f&.round(2) : nil
          }
        when 'categories'
          company.categories.select { |category| category.status == 'active' }
                 .map { |category| { id: category.id, name: category.name, slug: category.seo_url } }
                 .sort_by { |entry| entry[:name].to_s }.first(30)
        when 'headquarters'
          company.city.present? && company.state.present? ?
            { city: company.city, state: company.state } : nil
        when 'declared_coverage'
          states = company.coverage_state_list.first(27)
          cities = company.coverage_city_list.first(80)
          states.empty? && cities.empty? ? nil : { states: states, cities: cities }
        when 'services'
          values = Array(company.services_offered).select { |item| item.is_a?(String) && item.present? }
                                                       .map { |item| item.first(120) }.first(20)
          values.presence
        end
      end
    end
  end
end
