# frozen_string_literal: true

module Search
  class CompanyResultSerializer
    include Rails.application.routes.url_helpers

    MINIMAL_FEATURE_KEYS = %w[custom_ctas p2p_chat].freeze

    def initialize(company)
      @company = company
    end

    def as_json(*)
      {
        id: company.id,
        name: company.name,
        slug: company.slug,
        description: company.description,
        website: company.website,
        phone: company.phone,
        whatsapp: company.whatsapp,
        state: company.state,
        city: company.city,
        address: company.address,
        latitude: company.latitude,
        longitude: company.longitude,
        distance_km: safe_distance_km,
        featured: company.featured,
        verified: company.verified,
        sponsored: company.sponsored,
        active_admin: company.active_admin,
        p2p_chat_enabled: company.p2p_chat_enabled,
        cta_whatsapp_enabled: company.try(:cta_whatsapp_enabled),
        cta_whatsapp_url: company.try(:cta_whatsapp_url),
        whatsapp_enabled: company.try(:whatsapp_enabled),
        whatsapp_url: company.try(:whatsapp_url),
        rating_avg: company.rating_avg,
        average_rating: company.rating_avg,
        rating_count: company.rating_count,
        reviews_count: company.rating_count,
        total_reviews: company.rating_count,
        logo_url: attachment_url(company.logo),
        banner_url: attachment_url(company.banner),
        category_info: category_info,
        categories: categories,
        feature_access: feature_access
      }
    end

    private

    attr_reader :company

    def categories
      category_records.map do |category|
        {
          id: category.id,
          name: category.name,
          seo_url: category.seo_url
        }
      end
    rescue StandardError => e
      Rails.logger.warn(
        '[Search::CompanyResultSerializer] categories failed ' \
        "company=#{company.id}: #{e.class}: #{e.message}"
      )
      []
    end

    def category_info
      categories.first
    end

    def category_records
      @category_records ||= if company.association(:categories).loaded?
                              company.categories.to_a
                            else
                              company.categories.limit(3).to_a
                            end
    end

    def feature_access
      access = company.respond_to?(:feature_access) ? company.feature_access : {}
      access.slice(*MINIMAL_FEATURE_KEYS)
    rescue StandardError => e
      Rails.logger.warn(
        '[Search::CompanyResultSerializer] feature_access failed ' \
        "company=#{company.id}: #{e.class}: #{e.message}"
      )
      {}
    end

    def safe_distance_km
      value = company.try(:distance_km)
      value.respond_to?(:round) ? value.round(1) : value
    rescue StandardError
      nil
    end

    def attachment_url(attachment)
      return nil unless attachment&.attached?

      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

      rails_storage_proxy_url(attachment, options)
    rescue StandardError => e
      Rails.logger.warn(
        '[Search::CompanyResultSerializer] attachment failed ' \
        "company=#{company.id}: #{e.class}: #{e.message}"
      )
      nil
    end
  end
end
