# frozen_string_literal: true

module Recommendation
  class EligibilityQuery
    def self.call(context:)
      new(context: context).call
    end

    def initialize(context:)
      @context = context
    end

    def call
      scope = Company.active
                     .where(moderation_status: 'approved')
                     .where(deleted_at: nil)
                     .includes(:categories, :company_service_areas, logo_attachment: :blob)

      if context.segment.present?
        scope = scope.where(segment: context.segment)
      end

      if context.category_slug.present?
        scope = scope.joins(:categories).where(categories: { slug: context.category_slug })
      end

      if context.local?
        # Filter companies that match either via CompanyServiceArea or direct sede location
        matching_company_ids = fetch_matching_location_ids(context.city, context.state)
        scope = scope.where(id: matching_company_ids)
      elsif context.state_only?
        matching_company_ids = fetch_matching_state_ids(context.state)
        scope = scope.where(id: matching_company_ids)
      end

      scope.distinct
    end

    private

    attr_reader :context

    def fetch_matching_location_ids(city, state)
      state_upcase = state.to_s.strip.upcase
      city_downcase = city.to_s.strip.downcase

      # 1. Sede location match
      sede_ids = Company.where(state: state_upcase, city: city).pluck(:id)

      # 2. Service area match
      service_area_ids = CompanyServiceArea.active
                                            .where(state_code: state_upcase)
                                            .where('coverage_type = ? OR (coverage_type = ? AND LOWER(city_name) = ?)', 'state', 'city', city_downcase)
                                            .pluck(:company_id)

      national_ids = CompanyServiceArea.active.where(coverage_type: 'national').pluck(:company_id)

      (sede_ids + service_area_ids + national_ids).uniq
    end

    def fetch_matching_state_ids(state)
      state_upcase = state.to_s.strip.upcase

      sede_ids = Company.where(state: state_upcase).pluck(:id)
      service_area_ids = CompanyServiceArea.active.where(state_code: state_upcase).pluck(:company_id)
      national_ids = CompanyServiceArea.active.where(coverage_type: 'national').pluck(:company_id)

      (sede_ids + service_area_ids + national_ids).uniq
    end
  end
end
