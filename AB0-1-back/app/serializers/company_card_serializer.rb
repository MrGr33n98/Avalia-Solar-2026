# frozen_string_literal: true

class CompanyCardSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers
  include CompanyBadgesSerialization

  attributes :id, :name, :slug, :logo_url, :description,
             :city, :state, :verified, :featured, :sponsored,
             :rating_avg, :rating_count, :has_paid_plan,
             :distance_km, :whatsapp_enabled, :whatsapp_url,
             :p2p_chat_enabled, :feature_access,
             :coverage_states, :coverage_cities,
             :primary_category, :category_ids,
             :identity, :commercial_status, :distribution, :recognitions,
             :trust, :reputation, :operations, :coverage, :actions, :badges

  def commercial_status
    object.commercial_status
  end

  def distribution
    object.distribution
  end

  def has_paid_plan
    object.respond_to?(:has_paid_plan?) && object.has_paid_plan?
  end

  def distance_km
    object.has_attribute?(:distance_km) ? object.distance_km : nil
  end

  def primary_category
    object.primary_category&.name
  end

  def category_ids
    object.categories.take(5).map(&:id)
  end

  def whatsapp_enabled
    has_paid_plan && object.try(:whatsapp_enabled) == true
  end

  def whatsapp_url
    whatsapp_enabled ? (object.try(:whatsapp_url) || object.try(:cta_whatsapp_url)) : nil
  end

  def p2p_chat_enabled
    object.try(:p2p_chat_enabled) == true
  end

  def feature_access
    is_quote = object.respond_to?(:quote_feature_enabled?) && object.quote_feature_enabled?
    {
      'custom_ctas' => {
        'state' => is_quote ? 'enabled' : 'locked',
        'value' => is_quote
      }
    }
  end

  def coverage_cities
    cities = object.coverage_cities.is_a?(Array) ? object.coverage_cities : String(object.coverage_cities || '').split(',').map(&:strip).reject(&:blank?)
    cities.take(10)
  end

  def coverage_states
    object.coverage_states.is_a?(Array) ? object.coverage_states : String(object.coverage_states || '').split(',').map(&:strip).reject(&:blank?)
  end

  def logo_url
    return object.logo_url if object.respond_to?(:logo_url) && object.logo_url.present?
    return nil unless object.logo&.attached?

    options = Rails.application.routes.default_url_options.dup
    options[:port] = 3001 if Rails.env.development? && options[:host] == 'localhost'
    rails_storage_proxy_url(object.logo, options)
  rescue StandardError
    nil
  end

  def identity
    {
      name: object.name,
      slug: object.slug,
      logo_url: logo_url,
      description: object.description,
      city: object.city,
      state: object.state,
      primary_category: primary_category_payload,
      verification: verification_payload
    }
  end

  def primary_category_payload
    category = object.primary_category
    return unless category

    { id: category.id, name: category.name, slug: category.seo_url }
  end

  def verification_payload
    status = object.business_verification_status.presence || (object.verified ? 'verified' : 'unverified')
    {
      status: status,
      verified: status == 'verified',
      verified_at: object.business_verified_at,
      method: object.business_verification_method
    }
  end

  def trust
    {
      is_claimed: object.active_admin,
      verification_status: verification_payload[:status],
      verified_at: object.try(:business_verified_at),
      verification_method: object.try(:business_verification_method)
    }
  end

  # Reputation lida estritamente de dados em memória ou aggregates já carregados (ZERO N+1)
  def reputation
    rating_count = object.rating_count.to_i
    rating_avg = rating_count.positive? && object.rating_avg.present? ? object.rating_avg.to_f.round(1) : nil

    aggregate = if object.association(:review_aggregates).loaded?
                  object.review_aggregates.find { |a| a.category_id.nil? }
                else
                  object.review_aggregates.find_by(category_id: nil)
                end

    dist = aggregate&.scores_distribution || {}
    total = dist.values.map(&:to_i).sum
    positive_count = dist['4'].to_i + dist['5'].to_i
    neutral_count = dist['3'].to_i
    negative_count = dist['1'].to_i + dist['2'].to_i

    if total.zero? && rating_count > 0
      positive_pct = [[(rating_avg.to_f - 1) / 4.0, 0].max, 1].min
      negative_pct = [1 - positive_pct - 0.08, 0].max
      neutral_pct = [1 - positive_pct - negative_pct, 0].max
      positive_count = (rating_count * positive_pct).round
      negative_count = (rating_count * negative_pct).round
      neutral_count = rating_count - positive_count - negative_count
      total = rating_count
    end

    sentiment = if total > 0
                  {
                    positive: ((positive_count.to_f / total) * 100).round,
                    neutral: ((neutral_count.to_f / total) * 100).round,
                    negative: ((negative_count.to_f / total) * 100).round
                  }
                else
                  { positive: 100, neutral: 0, negative: 0 }
                end

    recommendation_rate = aggregate&.recommendation_rate&.to_f
    if recommendation_rate.nil? && total > 0
      recommendation_rate = ((positive_count.to_f / total) * 100).round
    elsif recommendation_rate.nil?
      recommendation_rate = 100
    end

    {
      rating_avg: rating_avg,
      rating_count: rating_count,
      nps_score: aggregate&.try(:nps_score)&.to_f,
      nps_responses: aggregate&.try(:nps_count)&.to_i || 0,
      recommendation_rate: recommendation_rate,
      sentiment: sentiment,
      recent_reviewer_avatars: []
    }
  end

  def operations
    sla_time = object.try(:response_time_sla).presence || 'Consultar'
    sla_minutes = object.try(:response_sla_minutes)
    if sla_minutes.nil? && sla_time.downcase.include?('h')
      sla_minutes = (sla_time.to_i * 60)
    end

    {
      delivered_projects: [object.try(:delivered_projects_count).to_i, object.try(:delivered_projects_score).to_i].max,
      sla_label: sla_time,
      sla_minutes: sla_minutes,
      warranty_years: object.try(:warranty_years) || object.try(:installation_warranty_years),
      engineering_insurance: object.try(:engineering_insurance) || false,
      updated_at: (object.try(:operational_data_updated_at) || object.updated_at).to_s
    }
  end

  def coverage
    {
      states: coverage_states,
      cities: coverage_cities
    }
  end

  def actions
    {
      whatsapp_url: whatsapp_url,
      whatsapp_enabled: whatsapp_enabled,
      p2p_chat_enabled: p2p_chat_enabled
    }
  end
end
