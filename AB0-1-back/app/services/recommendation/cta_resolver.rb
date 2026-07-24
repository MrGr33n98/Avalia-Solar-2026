# frozen_string_literal: true

module Recommendation
  class CtaResolver
    CTA_MAPPING = {
      'installer' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      },
      'integrator' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      },
      'mobility' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      },
      'supplier' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      },
      'distributor' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      },
      'finance' => {
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form'
      }
    }.freeze

    DEFAULT_PRIMARY_CTA = {
      type: 'view_profile',
      label: 'Ver perfil',
      action: 'navigate_profile'
    }.freeze

    def self.call(company)
      new(company).call
    end

    def initialize(company)
      @company = company
    end

    def call
      segment_key = company.segment.to_s.strip.downcase
      primary = CTA_MAPPING.fetch(segment_key, DEFAULT_PRIMARY_CTA).dup
      profile_url = build_profile_url(company)

      primary[:url] = profile_url

      secondary = {
        type: 'view_profile',
        label: 'Ver perfil',
        action: 'navigate_profile',
        url: profile_url
      }

      {
        primary: primary,
        secondary: secondary
      }
    end

    private

    attr_reader :company

    def build_profile_url(company)
      if company.slug.present?
        "/empresas/#{company.slug}"
      else
        "/empresas/#{company.id}"
      end
    end
  end
end
