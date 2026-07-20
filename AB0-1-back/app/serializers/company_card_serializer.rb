# frozen_string_literal: true

class CompanyCardSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :name, :slug, :logo_url, :featured, :sponsored,
             :identity, :trust, :reputation, :operations, :coverage, :actions

  def logo_url
    return nil unless object.logo&.attached?
    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
    rails_storage_proxy_url(object.logo, options)
  end

  def identity
    {
      name: object.name,
      slug: object.slug,
      logo_url: logo_url,
      description: object.description,
      city: object.city,
      state: object.state
    }
  end

  def trust
    {
      is_claimed: object.active_admin,
      verification_status: object.business_verification_status || 'unverified',
      verified_at: object.business_verified_at,
      verification_method: object.business_verification_method
    }
  end

  def reputation
    rating_avg = object.rating_avg.to_f
    rating_count = object.rating_count.to_i
    
    nps_responses = object.reviews.published.where.not(nps_score: nil).count
    nps_avg = nil
    recommendation_rate = nil
    
    if nps_responses > 0
      promoters = object.reviews.published.where(nps_score: 9..10).count
      detractors = object.reviews.published.where(nps_score: 0..6).count
      nps_avg = (((promoters - detractors).to_f / nps_responses) * 100).round(1)
      
      recommenders = object.reviews.published.where(nps_score: 7..10).count
      recommendation_rate = ((recommenders.to_f / nps_responses) * 100).round(1)
    end

    # Sentiment calculations based on review scores distribution (4-5: positive, 3: neutral, 1-2: negative)
    aggregate = object.review_aggregates.find_by(category_id: nil)
    dist = aggregate&.scores_distribution || {}
    
    total = dist.values.map(&:to_i).sum
    positive_count = (dist["4"].to_i + dist["5"].to_i)
    neutral_count = dist["3"].to_i
    negative_count = (dist["1"].to_i + dist["2"].to_i)

    # Fallback if cache aggregate is empty
    if total.zero? && rating_count > 0
      positive_count = object.reviews.published.where(rating: 4..5).count
      neutral_count = object.reviews.published.where(rating: 3).count
      negative_count = object.reviews.published.where(rating: 1..2).count
      total = positive_count + neutral_count + negative_count
    end

    sentiment = {
      positive: total > 0 ? ((positive_count.to_f / total) * 100).round : 100,
      neutral: total > 0 ? ((neutral_count.to_f / total) * 100).round : 0,
      negative: total > 0 ? ((negative_count.to_f / total) * 100).round : 0
    }

    # Fallback for recommendation rate
    if recommendation_rate.nil? && total > 0
      recommendation_rate = ((positive_count.to_f / total) * 100).round
    elsif recommendation_rate.nil?
      recommendation_rate = 100
    end

    # Load up to 3 recent reviewer avatars
    recent_reviewer_avatars = []
    if rating_count > 0
      recent_reviewer_avatars = object.reviews.published.includes(user: { avatar_attachment: :blob }).order(created_at: :desc).limit(3).map do |review|
        review.user&.avatar_url
      end.compact
    end

    {
      rating_avg: rating_avg,
      rating_count: rating_count,
      nps_score: nps_avg,
      nps_responses: nps_responses,
      recommendation_rate: recommendation_rate,
      sentiment: sentiment,
      recent_reviewer_avatars: recent_reviewer_avatars
    }
  end

  def operations
    sla_time = object.response_time_sla || 'Consultar'
    sla_minutes = object.response_sla_minutes
    if sla_minutes.nil? && sla_time.downcase.include?('h')
      sla_minutes = (sla_time.to_i * 60)
    end
    
    {
      delivered_projects: object.delivered_projects_count > 0 ? object.delivered_projects_count : object.delivered_projects_score.to_i,
      sla_label: sla_time,
      sla_minutes: sla_minutes,
      warranty_years: object.warranty_years || object.installation_warranty_years,
      engineering_insurance: object.engineering_insurance,
      updated_at: object.operational_data_updated_at || object.updated_at
    }
  end

  def coverage
    cities = object.coverage_cities.is_a?(Array) ? object.coverage_cities : String(object.coverage_cities || '').split(',').map(&:strip).reject(&:blank?)
    states = object.coverage_states.is_a?(Array) ? object.coverage_states : String(object.coverage_states || '').split(',').map(&:strip).reject(&:blank?)
    {
      states: states,
      cities: cities
    }
  end

  def actions
    {
      whatsapp_url: object.whatsapp_enabled ? (object.whatsapp_url || object.cta_whatsapp_url) : nil,
      whatsapp_enabled: object.whatsapp_enabled == true,
      p2p_chat_enabled: object.p2p_chat_enabled == true
    }
  end
end
