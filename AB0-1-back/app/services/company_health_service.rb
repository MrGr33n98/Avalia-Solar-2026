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

    dimensions = {
      profile: calculate_profile_score,
      reputation: calculate_reputation_score,
      content: calculate_content_score,
      discoverability: calculate_discoverability_score,
      integration: calculate_integration_score
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

    {
      score: overall_score,
      status: status,
      dimensions: dimensions
    }
  end

  private

  def calculate_profile_score
    points = 0
    total_points = 8

    # 1. Name present
    points += 1 if @company.name.present?
    # 2. Description present
    points += 1 if @company.description.present?
    # 3. Logo attached
    points += 1 if @company.logo.attached?
    # 4. Banner attached
    points += 1 if @company.banner.attached?
    # 5. City and State present
    points += 1 if @company.city.present? && @company.state.present?
    # 6. Contact present (website, phone, whatsapp, email_public)
    points += 1 if [@company.website, @company.phone, @company.whatsapp, @company.email_public].any?(&:present?)
    # 7. Categories associated
    points += 1 if @company.categories.any?
    # 8. Service/Coverage area present (coverage_states or company_service_areas)
    points += 1 if @company.coverage_states.present? || @company.company_service_areas.any?

    ((points.to_f / total_points) * 100).round
  end

  def calculate_reputation_score
    points = 0.0
    total_points = 4

    reviews_count = @company.reviews.count

    # 1. Total reviews count (>= 5 is 1.0, 1-4 is 0.5, 0 is 0)
    points += if reviews_count >= 5
                1.0
              elsif reviews_count > 0
                0.5
              else
                0.0
              end

    # 2. Average rating (rating_avg is out of 5.0, map to 0..1 point)
    rating_avg = @company.rating_avg.to_f
    points += (rating_avg / 5.0)

    # 3. Response rate (percentage of reviews with a reply. If no reviews, default to 1.0)
    if reviews_count > 0
      replied_count = @company.reviews.where.not(reply: nil).count
      points += (replied_count.to_f / reviews_count)
    else
      points += 1.0
    end

    # 4. Verified reviews rate (reviews verified by admin/system. If no reviews, default to 1.0)
    if reviews_count > 0
      verified_count = @company.reviews.where(verified: true).count
      points += (verified_count.to_f / reviews_count)
    else
      points += 1.0
    end

    ((points / total_points) * 100).round
  end

  def calculate_content_score
    points = 0.0
    total_points = 4

    # 1. Media Assets (Photos) present (>= 3 is 1.0, 1-2 is 0.5, 0 is 0)
    assets_count = @company.media_assets.attached? ? @company.media_assets.count : 0
    points += if assets_count >= 3
                1.0
              elsif assets_count > 0
                0.5
              else
                0.0
              end

    # 2. Videos present (>= 1 is 1.0, 0 is 0)
    points += @company.company_videos.any? ? 1.0 : 0.0

    # 3. Products present (>= 3 is 1.0, 1-2 is 0.5, 0 is 0)
    products_count = @company.products.count
    points += if products_count >= 3
                1.0
              elsif products_count > 0
                0.5
              else
                0.0
              end

    # 4. Projects present (>= 1 is 1.0, 0 is 0)
    points += @company.company_projects.any? ? 1.0 : 0.0

    ((points / total_points) * 100).round
  end

  def calculate_discoverability_score
    points = 0
    total_points = 3

    # 1. Published/Active status
    points += 1 if @company.status == 'active'
    # 2. Categories associated
    points += 1 if @company.categories.any?
    # 3. Coverage location (states/cities or service area)
    points += 1 if @company.coverage_states.present? || @company.company_service_areas.any?

    ((points.to_f / total_points) * 100).round
  end

  def calculate_integration_score
    webhooks = @company.company_webhooks
    return 0 if webhooks.empty?

    points = 0
    total_points = 2

    # 1. At least one webhook exists
    points += 1 if webhooks.any?

    # 2. At least one webhook is active
    points += 1 if webhooks.any?(&:active?)

    ((points.to_f / total_points) * 100).round
  end

  def default_health
    {
      score: 0,
      status: 'poor',
      dimensions: {
        profile: 0,
        reputation: 0,
        content: 0,
        discoverability: 0,
        integration: 0
      }
    }
  end
end
