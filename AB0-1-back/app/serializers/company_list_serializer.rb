# frozen_string_literal: true

class CompanyListSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers
  include CompanyBadgesSerialization

  # Campos escalares diretos do model
  attributes :id, :name, :description, :website,
             :slug, :state, :city, :address, :phone,
             :featured, :verified, :sponsored,
             :rating_avg, :rating_count,
             :banner_url, :logo_url, :verified_badge_image_url, :verified_badge_url,
             :cta_whatsapp_enabled, :cta_whatsapp_url,
             :whatsapp_enabled, :whatsapp_url,
             :active_admin, :p2p_chat_enabled,
             :social_proof_enabled, :can_use_social_proof,
             :effect, :media_upload_allowed,
             :has_paid_plan, :feature_access,
             :response_time_sla, :delivered_projects_score, :warranty_years,
             :coverage_cities, :coverage_states,
             :identity, :commercial_status, :distribution, :recognitions,
             :trust, :reputation, :badges

  def commercial_status
    object.commercial_status
  end

  def distribution
    object.distribution
  end

  def has_paid_plan = object.has_paid_plan?

  def banner_url
    return nil unless object.custom_banner_entitled?

    object.banner_url
  end

  def whatsapp
    has_paid_plan ? object.whatsapp : nil
  end

  def cta_whatsapp_enabled
    has_paid_plan && object.try(:whatsapp_enabled) == true
  end

  def cta_whatsapp_url
    cta_whatsapp_enabled ? (object.try(:whatsapp_url) || object.try(:cta_whatsapp_url)) : nil
  end

  def whatsapp_enabled
    cta_whatsapp_enabled
  end

  def whatsapp_url
    cta_whatsapp_url
  end


  # ─── Identidade estruturada (contrato CompanyCardData.identity) ───────────────
  def identity
    {
      name:        object.name,
      slug:        object.slug,
      logo_url:    object.logo_url,
      description: object.description,
      city:        object.city,
      state:       object.state,
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

  # ─── Trust (verificação, claim) ───────────────────────────────────────────────
  def trust
    {
      is_claimed:          object.active_admin,
      verification_status: verification_payload[:status],
      verified_at:         object.try(:business_verified_at),
      verification_method: object.try(:business_verification_method)
    }
  end

  # ─── Reputação real (sem N+1 extra: usa review_aggregate preloaded se possível) ─
  def reputation
    rating_count = object.rating_count.to_i
    rating_avg   = rating_count.positive? && object.rating_avg.present? ? object.rating_avg.to_f.round(1) : nil

    # Tenta usar o aggregate global (category_id = nil) já preloaded
    aggregate = if object.association(:review_aggregates).loaded?
                  object.review_aggregates.find { |a| a.category_id.nil? }
                else
                  object.review_aggregates.find_by(category_id: nil)
                end

    nps_avg       = aggregate&.try(:nps_score)&.to_f
    nps_responses = aggregate&.try(:nps_count)&.to_i || 0

    dist           = aggregate&.scores_distribution || {}
    total          = dist.values.map(&:to_i).sum
    positive_count = dist['4'].to_i + dist['5'].to_i
    neutral_count  = dist['3'].to_i
    negative_count = dist['1'].to_i + dist['2'].to_i

    # Fallback baseado no rating_avg (sem queries extras) quando aggregate não existe
    if total.zero? && rating_count > 0
      positive_pct   = [[(rating_avg - 1) / 4.0, 0].max, 1].min
      negative_pct   = [1 - positive_pct - 0.08, 0].max
      neutral_pct    = [1 - positive_pct - negative_pct, 0].max
      positive_count = (rating_count * positive_pct).round
      negative_count = (rating_count * negative_pct).round
      neutral_count  = rating_count - positive_count - negative_count
      total          = rating_count
    end

    sentiment = if total > 0
                  {
                    positive: ((positive_count.to_f / total) * 100).round,
                    neutral:  ((neutral_count.to_f  / total) * 100).round,
                    negative: ((negative_count.to_f / total) * 100).round
                  }
                else
                  { positive: 100, neutral: 0, negative: 0 }
                end

    recommendation_rate = aggregate&.recommendation_rate&.to_f
    if recommendation_rate.nil? && total > 0
      recommendation_rate = ((positive_count.to_f / total) * 100).round
    elsif recommendation_rate.nil?
      recommendation_rate = rating_avg.present? && rating_avg >= 3.5 ? 100 : 80
    end

    recent_reviewer_avatars = []

    {
      rating_avg:          rating_avg,
      rating_count:        rating_count,
      nps_score:           nps_avg,
      nps_responses:       nps_responses,
      recommendation_rate: recommendation_rate,
      sentiment:           sentiment,
      recent_reviewer_avatars: recent_reviewer_avatars
    }
  end

  # ─── Operações (SLA, projetos entregues) ─────────────────────────────────────
  def operations
    {
      delivered_projects:   [object.try(:delivered_projects_count).to_i,
                             object.try(:delivered_projects_score).to_i].max,
      sla_label:            object.try(:response_time_sla).presence || '24h',
      sla_minutes:          object.try(:response_sla_minutes),
      warranty_years:       object.try(:warranty_years) || object.try(:installation_warranty_years),
      engineering_insurance: object.try(:engineering_insurance) || false,
      updated_at:           (object.try(:operational_data_updated_at) || object.updated_at).to_s
    }
  end

  # ─── Cobertura estruturada ────────────────────────────────────────────────────
  def coverage
    cities = object.coverage_cities.is_a?(Array) ? object.coverage_cities : String(object.coverage_cities || '').split(',').map(&:strip).reject(&:blank?)
    states = object.coverage_states.is_a?(Array) ? object.coverage_states : String(object.coverage_states || '').split(',').map(&:strip).reject(&:blank?)
    { states: states, cities: cities }
  end

  # ─── Actions (CTAs de contato) ────────────────────────────────────────────────
  def actions
    {
      whatsapp_url:     whatsapp_url,
      whatsapp_enabled: whatsapp_enabled,
      p2p_chat_enabled: object.try(:p2p_chat_enabled) == true
    }
  end

  # ─── Feature Access (controle de features pagas via ActiveAdmin / planos) ─────
  def feature_access
    object.respond_to?(:feature_access) ? object.feature_access : {}
  rescue StandardError => e
    Rails.logger.warn("[CompanyListSerializer] feature_access error company_id=#{object.id}: #{e.message}")
    {}
  end
end
