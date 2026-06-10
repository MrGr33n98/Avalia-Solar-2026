# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Locations::CoverageNormalizer do
  describe '.normalize_state' do
    it 'returns canonical UF for valid states' do
      expect(described_class.normalize_state(' sc ')).to eq('SC')
    end

    it 'returns nil for unknown states' do
      expect(described_class.normalize_state('ZZ')).to be_nil
    end
  end

  describe '.normalize_city' do
    it 'resolves accentless city names using the official dataset' do
      expect(described_class.normalize_city('Sao Jose', state: 'SC')).to eq('São José')
    end
  end

  describe '.local_solar_path' do
    it 'builds public URLs without accents' do
      expect(described_class.local_solar_path('SC', 'Florianópolis')).to eq('/companies/energia-solar/sc/florianopolis')
      expect(described_class.local_solar_path('SC', 'São José')).to eq('/companies/energia-solar/sc/sao-jose')
    end
  end

  describe '.serves_city?' do
    it 'matches base city and coverage city with normalized accents' do
      company = Company.new(
        state: 'SC',
        city: 'Florianópolis',
        coverage_states: 'SC',
        coverage_cities: 'São José, Palhoça'
      )

      expect(described_class.serves_city?(company, 'Sao Jose', state: 'SC')).to be(true)
      expect(described_class.serves_city?(company, 'Florianopolis', state: 'SC')).to be(true)
      expect(described_class.serves_city?(company, 'Curitiba', state: 'PR')).to be(false)
    end

    it 'does not treat state-only coverage as city coverage' do
      company = Company.new(
        state: 'SP',
        city: 'São Paulo',
        coverage_states: 'PR',
        coverage_cities: nil
      )

      expect(described_class.serves_city?(company, 'Curitiba', state: 'PR')).to be(false)
      expect(described_class.serves_state?(company, 'PR')).to be(true)
    end
  end
end
