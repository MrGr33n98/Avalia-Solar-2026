# frozen_string_literal: true

module LeadWizard
  module FieldTargets
    LEAD_FIELD_KEYS = %w[
      full_name
      email
      phone
      zipcode
      city
      state
      consent
      nickname
      preferred_company_id
      category_id
      product_vertical
      project_profile
      quote_type
      system_size_band
      bill_value
      monthly_kwh
      decision_timeline
      address_full
    ].freeze

    module_function

    def default_for(key)
      LEAD_FIELD_KEYS.include?(key.to_s) ? 'lead' : 'wizard_answers'
    end

    def normalize(target, key:)
      target.presence || default_for(key)
    end
  end
end
