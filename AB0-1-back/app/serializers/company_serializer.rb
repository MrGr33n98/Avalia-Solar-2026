class CompanySerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :description, :website,
             :slug, :seo_title, :seo_description, :meta_description, :seo_keywords,
             :state, :city, :address, :phone, :whatsapp,
             :coverage_states, :coverage_cities, :local_solar_path,
             :email_public, :featured, :verified,
             :media_upload_allowed,
             :rating_avg, :rating_count,
             :banner_url, :logo_url, :verified_badge_image_url, :verified_badge_url,
             :created_at, :updated_at,
             :founded_year, :employees_count,
             :response_time_sla, :response_sla_minutes,
             :delivered_projects_count, :delivered_projects_score,
             :warranty_years, :installation_warranty_years, :post_sales_support,
             :business_verification_status, :business_verified_at, :business_verification_method,
             :instagram, :facebook, :linkedin,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url,
             :active_admin, :p2p_chat_enabled,
             :social_proof_enabled, :can_use_social_proof,
             :effect, :media_upload_allowed,
             :faqs,
             :financing_enabled,
             :financing_feature_allowed,
             :financing_tab_visible,
             :financing_profile,
             :financing_partners,
             :financing_offers,
             :categories,
             :category_info,
             :sector_ratings_enabled,
             :sector_rating_avg,
             :sector_rating_count,
             :badges,
             :media_urls, :videos,
             :review_aggregates,
             :actions

  def actions
    {
      whatsapp_url: whatsapp_url,
      whatsapp_enabled: whatsapp_enabled,
      p2p_chat_enabled: p2p_chat_enabled
    }
  end

  def review_aggregates
    return empty_review_aggregates unless review_aggregates_available?

    # Use preloaded association to avoid N+1
    aggregates = if object.association(:review_aggregates).loaded?
                   object.review_aggregates
                 else
                   ReviewAggregate.where(company_id: object.id).includes(:category)
                 end

    {
      global: serialize_aggregate(aggregates.find { |a| a.category_id.nil? }),
      by_category: aggregates.reject { |a| a.category_id.nil? }.map { |a| serialize_aggregate(a) }
    }
  rescue StandardError => e
    Rails.logger.warn("[CompanySerializer] review_aggregates unavailable for company=#{object.id}: #{e.class}: #{e.message}")
    empty_review_aggregates
  end

  def self.review_aggregates_table_exists?
    @review_aggregates_table_exists ||= begin
      ActiveRecord::Base.connection.table_exists?(:review_aggregates)
    rescue StandardError
      false
    end
  end

  def review_aggregates_available?
    self.class.review_aggregates_table_exists?
  end

  def empty_review_aggregates
    { global: nil, by_category: [] }
  end

  def serialize_aggregate(agg)
    return nil unless agg

    {
      category_id: agg.category_id,
      category_name: agg.category&.name,
      average_rating: agg.average_rating.to_f,
      total_reviews: agg.total_reviews,
      scores_distribution: agg.scores_distribution,
      criteria_breakdown: agg.criteria_breakdown
    }
  end

  def category_info
    # Use preloaded association if available
    categories_array = if object.association(:categories).loaded?
                         object.categories.to_a
                       else
                         object.categories.limit(1).to_a
                       end
    category = categories_array.first
    return nil unless category

    {
      id: category.id,
      name: category.name,
      seo_url: category.seo_url
    }
  end

  def categories
    # Use preloaded association to avoid N+1 and sorting query
    cats = if object.association(:categories).loaded?
             object.categories.to_a.sort_by(&:name)
           else
             object.categories.order(:name)
           end

    cats.map do |category|
      {
        id: category.id,
        name: category.name,
        seo_url: category.seo_url
      }
    end
  rescue StandardError => e
    Rails.logger.warn("[CompanySerializer] categories unavailable for company=#{object.id}: #{e.class}: #{e.message}")
    []
  end

  def badges
    object.badges.active.order(position: :asc).filter_map do |badge|
      {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        category: badge.category_label,
        year: badge.year,
        edition: badge.edition,
        public_slug: badge.public_slug,
        image_url: badge.image_url
      }
    rescue StandardError => e
      Rails.logger.error("Error serializing badge #{badge&.id} for company #{object.id}: #{e.message}")
      nil
    end
  end

  def seo_title
    object.try(:seo_title).presence
  end

  def seo_description
    object.try(:seo_description).presence || object.try(:meta_description).presence
  end

  def meta_description
    object.try(:meta_description).presence || object.try(:seo_description).presence
  end

  def banner_url
    generate_attachment_url(object.banner)
  end

  def logo_url
    generate_attachment_url(object.logo)
  end

  def verified_badge_image_url
    generate_attachment_url(object.verified_badge)
  end

  def verified_badge_url
    generate_attachment_url(object.verified_badge)
  end

  def cta_whatsapp_enabled
    return false unless quote_feature_enabled?

    object.respond_to?(:whatsapp_enabled) ? !!object.whatsapp_enabled : false
  end

  def cta_whatsapp_url
    return nil unless quote_feature_enabled?

    object.respond_to?(:whatsapp_url) ? object.whatsapp_url : nil
  end

  def whatsapp_enabled
    return false unless quote_feature_enabled?

    object.respond_to?(:whatsapp_enabled) ? !!object.whatsapp_enabled : false
  end

  def whatsapp_url
    return nil unless quote_feature_enabled?

    object.respond_to?(:whatsapp_url) ? object.whatsapp_url : nil
  end

  def active_admin
    object.respond_to?(:active_admin) ? !!object.active_admin : false
  end

  def p2p_chat_enabled
    object.respond_to?(:p2p_chat_enabled) ? !!object.p2p_chat_enabled : false
  end

  def coverage_states
    object.respond_to?(:coverage_state_list) ? object.coverage_state_list : []
  end

  def coverage_cities
    object.respond_to?(:coverage_city_list) ? object.coverage_city_list : []
  end

  def local_solar_path
    Locations::CoverageNormalizer.local_solar_path(object.state, object.city)
  end

  def social_proof_enabled
    object.respond_to?(:social_proof_enabled) ? !!object.social_proof_enabled : false
  end

  def can_use_social_proof
    object.respond_to?(:can_use_social_proof?) ? !!object.can_use_social_proof? : false
  end

  def quote_feature_enabled?
    object.respond_to?(:quote_feature_enabled?) ? object.quote_feature_enabled? : active_admin
  end

  def effect
    object.respond_to?(:effect) ? !!object.effect : false
  end

  def faqs
    return [] unless faq_block_enabled?

    # Use loaded association to avoid N+1
    faq_list = if object.association(:company_faqs).loaded?
                 object.company_faqs.select(&:published?).sort_by { |f| f.position || 999 }
               else
                 object.company_faqs.published_only.ordered
               end

    faq_list.map do |faq|
      faq.as_json(only: %i[id question answer status position])
    end
  end

  def financing_enabled
    object.respond_to?(:financing_enabled) ? !!object.financing_enabled : false
  end

  def media_upload_allowed
    if object.respond_to?(:media_upload_allowed?)
      object.media_upload_allowed?
    elsif object.respond_to?(:media_upload_allowed)
      !!object.media_upload_allowed
    else
      false
    end
  end

  def financing_feature_allowed
    object.respond_to?(:financing_feature_allowed?) ? !!object.financing_feature_allowed? : false
  end

  def financing_tab_visible
    object.financing_tab_visible?
  end

  def sector_ratings_enabled
    object.respond_to?(:sector_ratings_enabled?) ? object.sector_ratings_enabled? : false
  end

  def sector_rating_avg
    object.try(:sector_rating_avg) || 0.0
  end

  def sector_rating_count
    object.try(:sector_rating_count) || 0
  end

  def financing_profile
    return unless financing_tab_visible

    profile = object.company_financing_profile
    return unless profile

    profile.as_json(
      only: %i[
        id title subtitle disclaimer cta_label cta_url currency status
        default_amount_cents min_amount_cents max_amount_cents
        default_down_payment_percent min_down_payment_percent max_down_payment_percent
        default_term_months min_term_months max_term_months
        default_interest_rate_monthly min_interest_rate_monthly max_interest_rate_monthly
        grace_months_enabled max_grace_months amortization_type show_bank_logos show_fee_inputs
      ]
    )
  end

  def financing_partners
    return [] unless financing_tab_visible

    # Use loaded association to avoid N+1
    partners = if object.association(:company_financing_partners).loaded?
                 object.company_financing_partners.select(&:active?).sort_by { |p| p.position || 0 }
               else
                 object.company_financing_partners.active.ordered
               end

    partners.map do |partner|
      partner.as_json(only: %i[id name partner_type website priority position active badge]).merge(
        logo_url: generate_attachment_url(partner.logo)
      )
    end
  end

  def financing_offers
    return [] unless financing_tab_visible

    # Use loaded association to avoid N+1
    offers = if object.association(:company_financing_offers).loaded?
               object.company_financing_offers.select(&:active?).sort_by { |o| o.position || 0 }
             else
               object.company_financing_offers.active.ordered
             end

    offers.map do |offer|
      offer.as_json(
        only: %i[id name offer_type term_months interest_rate_monthly
                 min_down_payment_percent grace_months amortization_type
                 notes active position]
      )
    end
  end

  def media_urls
    object.media_urls || []
  end

  def videos
    object.published_videos.map do |v|
      { id: v.id, url: v.url, thumbnail_url: v.thumbnail_url, provider: v.provider, video_id: v.video_id }
    end
  end

  private

  def faq_block_enabled?
    access_entry = object.respond_to?(:feature_access) ? object.feature_access['faq_block'] : nil
    return access_entry['state'] == 'enabled' && access_entry['value'] != false if access_entry.present?

    if object.respond_to?(:feature_enabled_from_plan?)
      return object.feature_enabled_from_plan?(:faq_block, :faq, :faqs,
                                               include_defaults: true)
    end

    false
  end

  def generate_attachment_url(attachment)
    return nil unless attachment.attached?

    begin
      # Use rails_storage_proxy_url to serve images through the app instead of direct S3 redirects
      options = Rails.application.routes.default_url_options.dup
      options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'

      Rails.application.routes.url_helpers.rails_storage_proxy_url(attachment, options)
    rescue StandardError => e
      Rails.logger.error("Error generating attachment URL for company #{object.id}: #{e.message}")
      nil
    end
  end
end
