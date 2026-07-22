# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::CompanyIcpMatcherEngine, type: :service do
  let(:company) { create(:company) }
  let!(:profile) do
    CompanyIcpProfile.create!(
      company: company,
      min_monthly_bill: 1500.0,
      preferred_roof_types: ['colonial', 'metalico'],
      target_audiences: ['PF', 'PJ'],
      ev_charger_types: ['ac_wallbox'],
      target_cities: ['Cuiabá'],
      strictness_level: 'balanced'
    )
  end

  it 'calculates high match percentage for lead matching ICP criteria' do
    lead_data = {
      monthly_bill: 2000.0,
      roof_type: 'colonial',
      audience: 'PF',
      ev_charger_type: 'ac_wallbox',
      city: 'Cuiabá',
      urgency: 'immediate'
    }

    result = described_class.calculate_match(company: company, lead_data: lead_data)
    expect(result[:match_percentage]).to be >= 80.0
    expect(result[:is_icp]).to be true
  end

  it 'calculates lower match for out of ICP criteria' do
    lead_data = {
      monthly_bill: 300.0,
      roof_type: 'solo',
      audience: 'Rural',
      city: 'Manaus',
      urgency: 'indefinite'
    }

    result = described_class.calculate_match(company: company, lead_data: lead_data)
    expect(result[:match_percentage]).to be < 70.0
    expect(result[:is_icp]).to be false
  end
end
