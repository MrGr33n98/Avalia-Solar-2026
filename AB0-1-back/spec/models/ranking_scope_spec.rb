# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RankingScope do
  describe 'creation and canonical tuple' do
    it 'creates a scope with territory, basis and category' do
      floripa = Territory.municipality('Florianópolis', uf: 'SC')
      scope = described_class.new(
        methodology_release: 'organic-performance-v2@2.0.0',
        basis: :service_coverage,
        territory: floripa,
        category_id: 10,
        project_type: 'residential'
      )

      expect(scope.basis).to eq(:service_coverage)
      expect(scope.territory_canonical_id).to eq('BR-SC-florianopolis')
      expect(scope.category_id).to eq(10)
      expect(scope.project_type).to eq('residential')
      expect(scope.canonical_tuple).to eq([
        'organic-performance-v2@2.0.0',
        'service_coverage',
        'BR-SC-florianopolis',
        '10',
        'residential'
      ])
      expect(scope.scope_key).to be_present
      expect(scope.scope_key.length).to eq(64)
    end

    it 'generates identical scope_key for identical dimensions' do
      s1 = described_class.from_params(city: 'Florianópolis', state: 'SC', category: '10')
      s2 = described_class.from_params(city: 'Florianópolis', state: 'SC', category_id: 10)

      expect(s1.scope_key).to eq(s2.scope_key)
    end

    it 'adapts legacy sector param to project_type' do
      scope = described_class.from_params(sector: 'commercial', state: 'SC')

      expect(scope.project_type).to eq('commercial')
      expect(scope.territory_canonical_id).to eq('BR-SC')
    end
  end
end
