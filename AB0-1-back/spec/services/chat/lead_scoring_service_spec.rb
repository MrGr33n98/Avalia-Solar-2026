# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Chat::LeadScoringService, type: :service do
  describe '.calculate' do
    it 'calcula o score com base nos pesos cadastrados em SCORING_RULES' do
      profile = {
        vertical: 'solar',
        city: 'São Paulo',
        state: 'SP',
        wants_quote: true,
        consent_given: true,
        name: 'Cliente Teste'
      }

      # vertical_selected (10) + location_provided (15) + wants_quote (40) + contact_with_consent (50) = 115
      score = described_class.calculate(profile)
      expect(score).to eq(115)
    end

    it 'permite scores superiores a 100 sem clamping no cálculo base' do
      profile = {
        vertical: 'solar',
        city: 'Curitiba',
        state: 'PR',
        wants_quote: true,
        consent_given: true,
        phone: '11999999999',
        metadata: { 'wants_reviews' => true, 'wants_comparison' => true }
      }

      score = described_class.calculate(profile)
      expect(score).to be > 100
    end
  end

  describe '.temperature_for' do
    it 'mapeia o score para hot, warm ou cold segundo as faixas estabelecidas' do
      expect(described_class.temperature_for(75)).to eq('hot')
      expect(described_class.temperature_for(45)).to eq('warm')
      expect(described_class.temperature_for(15)).to eq('cold')
    end
  end
end
