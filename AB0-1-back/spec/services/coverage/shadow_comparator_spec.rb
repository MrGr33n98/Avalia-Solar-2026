# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Coverage::ShadowComparator do
  let(:mock_service_area_class) do
    Struct.new(:coverage_type, :state_code, :city_name, :is_active) do
      def is_active?
        is_active
      end
    end
  end

  let(:mock_company_class) do
    Struct.new(:id, :coverage_states, :coverage_cities, :company_service_areas) do
      def serves_city?(city, state = nil)
        target_city = city.to_s.strip.downcase
        coverage_cities.map(&:downcase).include?(target_city)
      end

      def serves_state?(state)
        target_state = state.to_s.strip.upcase
        coverage_states.map(&:upcase).include?(target_state)
      end
    end
  end

  describe '.compare' do
    it 'reports agreement_covered when both legacy and canonical match' do
      area = mock_service_area_class.new('city', 'SC', 'Florianópolis', true)
      company = mock_company_class.new(1, ['SC'], ['Florianópolis'], [area])

      result = described_class.compare(company, state: 'SC', city: 'Florianópolis', consumer: 'search')

      expect(result.legacy_covered).to be true
      expect(result.canonical_covered).to be true
      expect(result.match_type).to eq(:agreement_covered)
      expect(result.authorized_for_ranking).to be true
    end

    it 'reports agreement_not_covered when neither matches' do
      company = mock_company_class.new(2, ['SC'], ['Florianópolis'], [])

      result = described_class.compare(company, state: 'PR', city: 'Curitiba', consumer: 'leads')

      expect(result.legacy_covered).to be false
      expect(result.canonical_covered).to be false
      expect(result.match_type).to eq(:agreement_not_covered)
    end

    it 'reports legacy_false_positive when legacy covers but canonical does not have active relation' do
      company = mock_company_class.new(3, ['SC'], ['Joinville'], [])

      result = described_class.compare(company, state: 'SC', city: 'Joinville', consumer: 'mobivolt')

      expect(result.legacy_covered).to be true
      expect(result.canonical_covered).to be false
      expect(result.match_type).to eq(:legacy_false_positive)
    end

    it 'reports legacy_false_negative when canonical covers via national but legacy city list was empty' do
      area_national = mock_service_area_class.new('national', nil, nil, true)
      company = mock_company_class.new(4, [], [], [area_national])

      result = described_class.compare(company, state: 'SP', city: 'Campinas', consumer: 'recommendation')

      expect(result.legacy_covered).to be false
      expect(result.canonical_covered).to be true
      expect(result.match_type).to eq(:legacy_false_negative)
    end
  end
end
