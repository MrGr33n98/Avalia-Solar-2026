# frozen_string_literal: true

module BrandHero
  # Separate paid-plan permission to prepare slides from the public rollout.
  # The global switch must NEVER prevent a paying company from managing drafts.
  class Eligibility
    MAX_SLIDES = 3

    def self.limit(company)
      return 0 unless company&.has_paid_plan?
      return 0 unless company.entitled?(:brand_hero_carousel)

      raw_limit = company.entitlement_limit(:brand_hero_slides_limit)
      [[raw_limit.to_i, 0].max, MAX_SLIDES].min
    rescue StandardError => e
      Rails.logger.warn("[BrandHero] quota resolution error: #{e.class}: #{e.message}")
      0
    end

    def self.manageable?(company)
      limit(company).positive?
    end

    def self.allowed?(company)
      ENV['BRAND_HERO_CAROUSEL_ENABLED'] == 'true' && manageable?(company)
    end

    def self.reason(company)
      return 'paid_plan_required' unless company&.has_paid_plan?
      return 'feature_locked' unless company.entitled?(:brand_hero_carousel)
      return 'quota_zero' unless limit(company).positive?
      return 'rollout_disabled' unless ENV['BRAND_HERO_CAROUSEL_ENABLED'] == 'true'

      'ready'
    rescue StandardError
      'feature_locked'
    end
  end
end
