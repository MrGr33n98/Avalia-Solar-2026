# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'TrustScore calculation parity' do
  let(:company) do
    create(
      :company,
      verified: true,
      rating_avg: 4.5,
      reviews_count: 48,
      profile_views_count: 120,
      cta_clicks_count: 16,
      leads_count: 12
    )
  end

  it 'returns the same result from the synchronous facade and canonical calculator' do
    canonical = TrustScore::Calculator.new(company).call
    synchronous = TrustScore::CalculationService.new(company).calculate!

    expect(synchronous[:score]).to eq(canonical[:score])
    expect(synchronous[:components]).to eq(canonical[:components])
    expect(synchronous.dig(:components, :definition_version)).to eq(TrustScore::Definition::VERSION)
  end

  it 'persists the canonical result in the daily batch worker' do
    expected = TrustScore::Calculator.new(company).call

    Analytics::TrustScoreWorker.new.perform

    persisted = CompanyTrustScore.find_by!(company_id: company.id)
    expect(persisted.score.to_f).to eq(expected[:score])
    expect(persisted.components['definition_version']).to eq(TrustScore::Definition::VERSION)
  end
end
