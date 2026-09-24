# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Coverage::ReconciliationClassifier do
  let(:mock_company_class) do
    Struct.new(:id, :coverage_states, :coverage_cities, :company_service_areas) do
      def coverage_state_list
        Array(coverage_states).flatten.map(&:to_s).map(&:upcase)
      end

      def coverage_city_list
        Array(coverage_cities).flatten.map(&:to_s)
      end
    end
  end

  let(:mock_service_area_class) do
    Struct.new(:coverage_type, :state_code, :city_name, :is_active) do
      def is_active?
        is_active
      end
    end
  end

  describe '#classify' do
    it 'classifies as :none when both legacy and relations are empty' do
      company = mock_company_class.new(1, [], [], [])
      result = described_class.classify(company)

      expect(result.status).to eq(:none)
      expect(result.flags).to be_empty
    end

    it 'classifies as :legacy_only when only legacy fields are populated' do
      company = mock_company_class.new(2, ['SC'], ['Florianópolis'], [])
      result = described_class.classify(company)

      expect(result.status).to eq(:legacy_only)
      expect(result.legacy_states).to eq(['SC'])
      expect(result.legacy_cities).to eq(['florianópolis'])
      expect(result.relation_states).to be_empty
      expect(result.relation_cities).to be_empty
    end

    it 'classifies as :relation_only when only active service areas exist' do
      area = mock_service_area_class.new('city', 'SC', 'Joinville', true)
      company = mock_company_class.new(3, [], [], [area])
      result = described_class.classify(company)

      expect(result.status).to eq(:relation_only)
      expect(result.relation_cities).to eq(['joinville'])
      expect(result.legacy_cities).to be_empty
    end

    it 'classifies as :equal when legacy and active relations match exactly' do
      area_state = mock_service_area_class.new('state', 'PR', nil, true)
      area_city = mock_service_area_class.new('city', 'PR', 'Curitiba', true)
      company = mock_company_class.new(4, ['PR'], ['Curitiba'], [area_state, area_city])
      result = described_class.classify(company)

      expect(result.status).to eq(:equal)
      expect(result.divergence_details).to be_empty
    end

    it 'classifies as :divergent and details differences when sets differ' do
      area = mock_service_area_class.new('city', 'PR', 'Curitiba', true)
      company = mock_company_class.new(5, ['PR'], ['Londrina'], [area])
      result = described_class.classify(company)

      expect(result.status).to eq(:divergent)
      expect(result.divergence_details[:cities_in_legacy_only]).to eq(['londrina'])
      expect(result.divergence_details[:cities_in_relation_only]).to eq(['curitiba'])
    end

    it 'flags inactive areas and national coverage correctly' do
      area_national = mock_service_area_class.new('national', nil, nil, true)
      area_inactive = mock_service_area_class.new('state', 'SP', nil, false)
      company = mock_company_class.new(6, ['SP'], [], [area_national, area_inactive])
      result = described_class.classify(company)

      expect(result.status).to eq(:divergent)
      expect(result.flags).to include(:has_national, :has_inactive)
      expect(result.divergence_details[:has_national]).to be true
    end

    it 'detects malformed/unknown tokens in legacy strings' do
      company = mock_company_class.new(7, '["SP", invalid}', [], [])
      result = described_class.classify(company)

      expect(result.flags).to include(:unknown_tokens)
    end
  end
end
