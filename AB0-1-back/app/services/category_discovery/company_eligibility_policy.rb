# frozen_string_literal: true

module CategoryDiscovery
  class CompanyEligibilityPolicy
    ORGANIC_SORT_OPTIONS = %w[recommended rating_desc reviews_desc name_asc].freeze

    def self.eligible_companies_scope(category:, capability_type: nil, delivery_mode: nil)
      return Company.none if category.nil?

      scope = category.companies.where(status: 'active')

      if capability_type.present?
        scope = scope.joins(:company_category_capabilities).where(
          company_category_capabilities: {
            category_id: category.id,
            capability_type: capability_type.to_s,
            verified: true
          }
        ).distinct
      end

      if delivery_mode.present? && CompanyCategoryCapability.column_names.include?('service_delivery_mode')
        scope = scope.joins(:company_category_capabilities).where(
          company_category_capabilities: {
            category_id: category.id,
            service_delivery_mode: delivery_mode.to_s,
            verified: true
          }
        ).distinct
      end

      scope
    end

    # Deterministic organic ordering independent of commercial `featured`/`sponsored` placement (CDSI-093 / R35)
    def self.apply_organic_order(scope, sort: 'recommended')
      case sort.to_s
      when 'name_asc'
        scope.order(name: :asc, id: :asc)
      when 'reviews_desc'
        scope.order(rating_count: :desc, rating_avg: :desc, id: :asc)
      when 'rating_desc', 'recommended', ''
        scope.order(rating_avg: :desc, rating_count: :desc, id: :asc)
      else
        scope.order(rating_avg: :desc, rating_count: :desc, id: :asc)
      end
    end

    # Safe public capability DTO — never leaks internal curation evidence or reviewer IDs (CDSI-091 / R38)
    def self.serialize_public_capability(capability)
      {
        id: capability.id,
        capability_type: capability.capability_type,
        service_delivery_mode: capability.respond_to?(:service_delivery_mode) ? capability.service_delivery_mode : nil,
        coverage_scope: capability.coverage_scope,
        verified: capability.verified,
        verified_at: capability.verified_at
      }.compact
    end
  end
end
