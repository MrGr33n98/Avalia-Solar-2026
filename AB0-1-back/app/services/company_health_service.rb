# frozen_string_literal: true

class CompanyHealthService
  def initialize(company)
    @company = company
  end

  def self.call(company)
    new(company).call
  end

  def call
    return default_health if @company.nil?

    profile_score, profile_pos, profile_miss = calculate_profile_score
    reputation_score, reputation_pos, reputation_miss = calculate_reputation_score
    content_score, content_pos, content_miss = calculate_content_score
    discoverability_score, discoverability_pos, discoverability_miss = calculate_discoverability_score
    integration_score, integration_pos, integration_miss = calculate_integration_score

    dimensions = {
      profile: profile_score,
      reputation: reputation_score,
      content: content_score,
      discoverability: discoverability_score,
      integration: integration_score
    }

    # Calculate overall score as simple average of the 5 dimensions
    overall_score = (dimensions.values.sum / 5.0).round

    status = case overall_score
             when 90..100 then 'excellent'
             when 70..89 then 'very_good'
             when 50..69 then 'good'
             when 30..49 then 'regular'
             else 'poor'
             end

    positive_items = profile_pos + reputation_pos + content_pos + discoverability_pos + integration_pos
    missing_items = profile_miss + reputation_miss + content_miss + discoverability_miss + integration_miss

    {
      score: overall_score,
      status: status,
      max_score: 100,
      algorithm_version: 'v1.0',
      calculated_at: Time.current.iso8601,
      dimensions: dimensions,
      positive_items: positive_items,
      missing_items: missing_items,
      explainability: {
        profile: {
          score: profile_score,
          max_score: 100,
          positive_items: profile_pos,
          missing_items: profile_miss
        },
        reputation: {
          score: reputation_score,
          max_score: 100,
          positive_items: reputation_pos,
          missing_items: reputation_miss
        },
        content: {
          score: content_score,
          max_score: 100,
          positive_items: content_pos,
          missing_items: content_miss
        },
        discoverability: {
          score: discoverability_score,
          max_score: 100,
          positive_items: discoverability_pos,
          missing_items: discoverability_miss
        },
        integration: {
          score: integration_score,
          max_score: 100,
          positive_items: integration_pos,
          missing_items: integration_miss
        }
      }
    }
  end

  private

  def calculate_profile_score
    points = 0
    total_points = 8
    pos = []
    miss = []

    # 1. Name present
    if @company.name.present?
      points += 1
      pos << 'profile_name_present'
    else
      miss << 'profile_name_missing'
    end

    # 2. Description present
    if @company.description.present?
      points += 1
      pos << 'profile_description_present'
    else
      miss << 'profile_description_missing'
    end

    # 3. Logo attached
    if @company.logo.attached?
      points += 1
      pos << 'profile_logo_present'
    else
      miss << 'profile_logo_missing'
    end

    # 4. Banner attached
    if @company.banner.attached?
      points += 1
      pos << 'profile_banner_present'
    else
      miss << 'profile_banner_missing'
    end

    # 5. City and State present
    if @company.city.present? && @company.state.present?
      points += 1
      pos << 'profile_location_present'
    else
      miss << 'profile_location_missing'
    end

    # 6. Contact present (website, phone, whatsapp, email_public)
    if [@company.website, @company.phone, @company.whatsapp, @company.email_public].any?(&:present?)
      points += 1
      pos << 'profile_contact_present'
    else
      miss << 'profile_contact_missing'
    end

    # 7. Categories associated
    if @company.categories.any?
      points += 1
      pos << 'profile_categories_present'
    else
      miss << 'profile_categories_missing'
    end

    # 8. Service/Coverage area present (coverage_states or company_service_areas)
    if @company.coverage_states.present? || @company.company_service_areas.any?
      points += 1
      pos << 'profile_service_area_present'
    else
      miss << 'profile_service_area_missing'
    end

    [((points.to_f / total_points) * 100).round, pos, miss]
  end

  def calculate_reputation_score
    points = 0.0
    total_points = 4
    pos = []
    miss = []

    reviews_count = @company.reviews.count

    # 1. Total reviews count (>= 5 is 1.0, 1-4 is 0.5, 0 is 0)
    if reviews_count >= 5
      points += 1.0
      pos << 'reputation_reviews_sufficient'
    elsif reviews_count > 0
      points += 0.5
      pos << 'reputation_reviews_low'
      miss << 'reputation_reviews_insufficient'
    else
      miss << 'reputation_reviews_missing'
    end

    # 2. Average rating (rating_avg is out of 5.0, map to 0..1 point)
    rating_avg = @company.rating_avg.to_f
    if rating_avg >= 4.0
      points += (rating_avg / 5.0)
      pos << 'reputation_rating_good'
    elsif rating_avg > 0.0
      points += (rating_avg / 5.0)
      pos << 'reputation_rating_low'
      miss << 'reputation_rating_poor'
    else
      miss << 'reputation_rating_missing'
    end

    # 3. Response rate (percentage of reviews with a reply. If no reviews, default to 1.0)
    if reviews_count > 0
      replied_count = @company.reviews.where.not(reply: nil).count
      rate = replied_count.to_f / reviews_count
      points += rate
      if rate >= 0.8
        pos << 'reputation_response_rate_high'
      else
        pos << 'reputation_response_rate_low'
        miss << 'reputation_response_rate_insufficient'
      end
    else
      points += 1.0
      pos << 'reputation_no_reviews_response_default'
    end

    # 4. Verified reviews rate (reviews verified by admin/system. If no reviews, default to 1.0)
    if reviews_count > 0
      verified_count = @company.reviews.where(verified: true).count
      rate = verified_count.to_f / reviews_count
      points += rate
      if rate >= 0.8
        pos << 'reputation_verified_rate_high'
      else
        pos << 'reputation_verified_rate_low'
        miss << 'reputation_verified_rate_insufficient'
      end
    else
      points += 1.0
      pos << 'reputation_no_reviews_verified_default'
    end

    [((points / total_points) * 100).round, pos, miss]
  end

  def calculate_content_score
    points = 0.0
    total_points = 4
    pos = []
    miss = []

    # 1. Media Assets (Photos) present (>= 3 is 1.0, 1-2 is 0.5, 0 is 0)
    assets_count = @company.media_assets.attached? ? @company.media_assets.count : 0
    if assets_count >= 3
      points += 1.0
      pos << 'content_media_sufficient'
    elsif assets_count > 0
      points += 0.5
      pos << 'content_media_low'
      miss << 'content_media_insufficient'
    else
      miss << 'content_media_missing'
    end

    # 2. Videos present (>= 1 is 1.0, 0 is 0)
    if @company.company_videos.any?
      points += 1.0
      pos << 'content_videos_present'
    else
      miss << 'content_videos_missing'
    end

    # 3. Products present (>= 3 is 1.0, 1-2 is 0.5, 0 is 0)
    products_count = @company.products.count
    if products_count >= 3
      points += 1.0
      pos << 'content_products_sufficient'
    elsif products_count > 0
      points += 0.5
      pos << 'content_products_low'
      miss << 'content_products_insufficient'
    else
      miss << 'content_products_missing'
    end

    # 4. Projects present (>= 1 is 1.0, 0 is 0)
    if @company.company_projects.any?
      points += 1.0
      pos << 'content_projects_present'
    else
      miss << 'content_projects_missing'
    end

    [((points / total_points) * 100).round, pos, miss]
  end

  def calculate_discoverability_score
    points = 0
    total_points = 3
    pos = []
    miss = []

    # 1. Published/Active status
    if @company.status == 'active'
      points += 1
      pos << 'discoverability_active_status_present'
    else
      miss << 'discoverability_active_status_missing'
    end

    # 2. Categories associated
    if @company.categories.any?
      points += 1
      pos << 'discoverability_categories_present'
    else
      miss << 'discoverability_categories_missing'
    end

    # 3. Coverage location (states/cities or service area)
    if @company.coverage_states.present? || @company.company_service_areas.any?
      points += 1
      pos << 'discoverability_service_area_present'
    else
      miss << 'discoverability_service_area_missing'
    end

    [((points.to_f / total_points) * 100).round, pos, miss]
  end

  def calculate_integration_score
    webhooks = @company.company_webhooks
    pos = []
    miss = []

    if webhooks.empty?
      miss << 'integration_webhooks_missing'
      miss << 'integration_webhooks_active_missing'
      return [0, pos, miss]
    end

    points = 0
    total_points = 2

    # 1. At least one webhook exists
    if webhooks.any?
      points += 1
      pos << 'integration_webhooks_present'
    else
      miss << 'integration_webhooks_missing'
    end

    # 2. At least one webhook is active
    if webhooks.any?(&:active?)
      points += 1
      pos << 'integration_webhooks_active_present'
    else
      miss << 'integration_webhooks_active_missing'
    end

    [((points.to_f / total_points) * 100).round, pos, miss]
  end

  def default_health
    {
      score: 0,
      status: 'poor',
      max_score: 100,
      algorithm_version: 'v1.0',
      calculated_at: Time.current.iso8601,
      dimensions: {
        profile: 0,
        reputation: 0,
        content: 0,
        discoverability: 0,
        integration: 0
      },
      positive_items: [],
      missing_items: [],
      explainability: {
        profile: { score: 0, max_score: 100, positive_items: [], missing_items: [] },
        reputation: { score: 0, max_score: 100, positive_items: [], missing_items: [] },
        content: { score: 0, max_score: 100, positive_items: [], missing_items: [] },
        discoverability: { score: 0, max_score: 100, positive_items: [], missing_items: [] },
        integration: { score: 0, max_score: 100, positive_items: [], missing_items: [] }
      }
    }
  end
end
