# frozen_string_literal: true

module BrandHero
  class Eligibility
    def self.allowed?(company)
      return false unless ENV['BRAND_HERO_CAROUSEL_ENABLED'] == 'true'
      return false unless company&.has_paid_plan?

      company.entitled?(:brand_hero_carousel)
    rescue StandardError => e
      Rails.logger.warn("[BrandHero] entitlement error #{e.class}: #{e.message}")
      false
    end
  end
end
