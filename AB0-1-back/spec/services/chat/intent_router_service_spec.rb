# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::IntentRouterService do
  it 'retorna intenção primária, secundária e origem de regra' do
    result = described_class.route('Quero financiamento e também comparar instaladores')
    expect(result[:primary_intent]).to eq('company_recommendation')
    expect(result[:secondary_intents]).to include('financing_question')
    expect(result[:router_source]).to eq('rule')
  end

  it 'usa fallback com confiança baixa' do
    result = described_class.route('texto sem intenção conhecida')
    expect(result).to include(intent: 'fallback', router_source: 'fallback')
  end
end
