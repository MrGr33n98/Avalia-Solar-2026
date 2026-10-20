# frozen_string_literal: true

module Recommendation
  class CtaResolver
    CTA_MAPPING = {
      'installer' => {
        type: 'request_quote',
        label: 'Solicitar orçamento',
        action: 'open_lead_modal'
      },
      'integrator' => {
        type: 'request_quote',
        label: 'Solicitar orçamento',
        action: 'open_lead_modal'
      },
      'mobility' => {
        type: 'request_quote',
        label: 'Solicitar orçamento',
        action: 'open_lead_modal'
      },
      'supplier' => {
        type: 'find_installers',
        label: 'Encontrar integradores',
        action: 'open_lead_modal'
      },
      'distributor' => {
        type: 'find_installers',
        label: 'Encontrar integradores',
        action: 'open_lead_modal'
      },
      'finance' => {
        type: 'simulate_financing',
        label: 'Simular financiamento',
        action: 'open_lead_modal'
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
        type: 'rate_company',
        label: 'Avaliar essa empresa',
        action: 'open_review_form',
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
      identifier = company.slug.presence || company.id
      "/companies/#{identifier}"
    end
  end
end
