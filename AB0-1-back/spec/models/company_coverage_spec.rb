# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Company, type: :model do
  describe 'coverage helpers' do
    it 'returns canonical state and city lists' do
      company = described_class.new(
        state: 'SC',
        city: 'Florianópolis',
        coverage_states: 'sc, pr',
        coverage_cities: 'Sao Jose, Curitiba'
      )

      expect(company.coverage_state_list).to eq(%w[SC PR])
      expect(company.coverage_city_list).to include('São José', 'Curitiba')
    end

    it 'preserves unknown legacy coverage tokens when controlled values are saved' do
      company = described_class.new(
        coverage_states: 'Grande Sul',
        coverage_cities: 'Grande Florianópolis'
      )

      company.coverage_state_codes = ['SC']
      company.coverage_city_names = ['Florianópolis']
      company.valid?

      expect(company.coverage_states).to include('SC', 'Grande Sul')
      expect(company.coverage_cities).to include('Florianópolis', 'Grande Florianópolis')
    end
  end

  describe '.serving_state' do
    it 'keeps the public state filter separate from coverage filters' do
      sql = described_class.serving_state('SC').to_sql

      expect(sql).to include('companies.state')
      expect(sql).to include('coverage_states')
    end
  end

  describe '.serving_city_strict' do
    it 'requires explicit city coverage when company is outside the requested city' do
      state_only = create(
        :company,
        status: 'active',
        state: 'SP',
        city: 'São Paulo',
        coverage_states: 'PR',
        coverage_cities: nil
      )
      city_covered = create(
        :company,
        status: 'active',
        state: 'SP',
        city: 'São Paulo',
        coverage_states: 'PR',
        coverage_cities: 'Curitiba'
      )
      local = create(:company, status: 'active', state: 'PR', city: 'Curitiba')

      result_ids = described_class.serving_city_strict('Curitiba', 'PR').pluck(:id)

      expect(result_ids).to include(city_covered.id, local.id)
      expect(result_ids).not_to include(state_only.id)
    end
  end
end
