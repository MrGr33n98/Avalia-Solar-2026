# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Company, type: :model do
  describe '#comparison_profile' do
    let(:company) { build(:company) }

    it 'exposes the same commercial terms written by Dashboard and ActiveAdmin' do
      company.quote_turnaround = 'within_24h'
      company.technical_visit = 'free'
      company.financing_availability = 'available'
      company.installation_terms = 'included'
      company.maintenance_availability = 'offered'
      company.after_sales_support = 'consult'
      company.installation_team = 'in_house'
      company.system_monitoring = 'app'
      company.payment_methods = 'pix,credit_card'

      profile = company.comparison_profile

      expect(profile).to include(
        quote_turnaround: 'within_24h',
        technical_visit: 'free',
        financing_availability: 'available',
        installation_terms: 'included',
        maintenance_availability: 'offered',
        after_sales_support: 'consult',
        installation_team: 'in_house',
        system_monitoring: 'app',
        payment_methods: %w[pix credit_card]
      )
    end

    it 'does not overwrite an explicitly negative commercial statement with a positive legacy boolean' do
      company.financing_enabled = true
      company.financing_availability = 'not_offered'
      company.post_sales_support = true
      company.after_sales_support = 'not_offered'

      expect(company.comparison_profile).to include(
        financing_availability: 'not_offered',
        after_sales_support: 'not_offered'
      )
    end

    it 'keeps declared warranty years distinct from company confirmation' do
      company.warranty_years = 5
      company.warranty_confirmed = false

      expect(company.comparison_profile).to include(
        warranty_years: 5,
        warranty_confirmed: false
      )
    end
  end
end
