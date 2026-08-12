# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::LeadScoringService do
  it 'retorna contrato separado de intenção e aderência' do
    result = described_class.calculate({ vertical: 'solar', city: 'São Paulo', intent: 'solar_quote' })
    expect(result).to include(:algorithm_version, :intent_score, :fit_score, :total_score, :score_contract)
    expect(result[:score_contract][:icp_match]).to be_nil
  end
end
