# frozen_string_literal: true

module Companies
  # Public, read-only representation of the same commercial criteria on
  # the Brand Page and Dashboard. Intentionally excludes personal contacts
  # and internal company/lead data. Subscription gates are backend-resolved.
  class ComparisonSnapshotService
    VERSION = 1
    MAX_COMPANIES = 3

    def self.call(ids:)
      requested_ids = Array(ids).map(&:to_i).uniq.take(MAX_COMPANIES)
      matches = ::Company.active
                         .where(id: requested_ids)
                         .includes(:plan, :categories, :primary_category)
                         .index_by(&:id)

      {
        schema_version: VERSION,
        refreshed_at: Time.current.utc.iso8601(6),
        companies: requested_ids.filter_map { |id| serialize(matches[id]) if matches[id] },
        missing_ids: requested_ids.reject { |id| matches.key?(id) }
      }
    end

    def self.serialize(company)
      {
        id: company.id,
        slug: company.slug,
        name: company.name,
        status: company.status,
        description: company.description,
        featured: company.featured?,
        sponsored: company.sponsored?,
        category_ids: company.categories.map(&:id),
        categories: company.categories.map { |category| { id: category.id, name: category.name, seo_url: category.seo_url } },
        primary_category: company.primary_category&.name,
        project_types: company.project_types,
        segment: company.segment,
        city: company.city,
        state: company.state,
        logo_url: CompanySerializer.new(company).logo_url,
        rating_avg: company.rating_avg,
        rating_count: company.rating_count,
        verified: company.verified?,
        verification_status: company.business_verification_status,
        coverage_cities: company.coverage_city_list,
        coverage_states: company.coverage_state_list,
        response_time_sla: company.response_time_sla,
        payment_methods: company.payment_methods,
        services_offered: company.services_offered,
        financing_enabled: company.financing_enabled,
        post_sales_support: company.post_sales_support,
        warranty_years: company.warranty_years,
        installation_warranty_years: company.installation_warranty_years,
        comparison_profile: company.comparison_profile,
        has_paid_plan: company.has_paid_plan?,
        quote_cta_enabled: company.quote_cta_enabled?,
        feature_access: company.feature_access,
        updated_at: company.updated_at.utc.iso8601(6)
      }
    end
    private_class_method :serialize
  end
end
