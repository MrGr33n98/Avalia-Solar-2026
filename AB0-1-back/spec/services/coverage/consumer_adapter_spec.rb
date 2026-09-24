# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Coverage::ConsumerAdapter do
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
        coverage_cities.include?(city)
      end

      def serves_state?(state)
        coverage_states.include?(state)
      end
    end
  end

  describe '.serves_city?' do
    it 'delegates to legacy when canonical flag is disabled' do
      company = mock_company_class.new(1, ['SC'], ['Florianópolis'], [])

      # Flag not set, defaults to legacy
      expect(described_class.serves_city?(company, 'Florianópolis', 'SC', consumer: 'leads')).to be true
      expect(described_class.serves_city?(company, 'Joinville', 'SC', consumer: 'leads')).to be false
    end

    it 'uses canonical CoverageResolver when per-consumer flag is active' do
      area = mock_service_area_class.new('city', 'SC', 'Joinville', true)
      company = mock_company_class.new(2, ['SC'], ['Florianópolis'], [area])

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('ENABLE_CANONICAL_COVERAGE_LEADS').and_return('true')

      # Now it uses CompanyServiceArea (where Joinville exists, but Florianópolis does not)
      expect(described_class.serves_city?(company, 'Joinville', 'SC', consumer: 'leads')).to be true
      expect(described_class.serves_city?(company, 'Florianópolis', 'SC', consumer: 'leads')).to be false
    end
  end

  describe '.serves_state?' do
    it 'delegates to legacy when flag is disabled' do
      company = mock_company_class.new(3, ['PR'], [], [])

      expect(described_class.serves_state?(company, 'PR', consumer: 'search')).to be true
      expect(described_class.serves_state?(company, 'SC', consumer: 'search')).to be false
    end

    it 'uses canonical CoverageResolver when global flag is active' do
      area = mock_service_area_class.new('state', 'SC', nil, true)
      company = mock_company_class.new(4, ['PR'], [], [area])

      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('ENABLE_CANONICAL_COVERAGE_ALL').and_return('true')

      expect(described_class.serves_state?(company, 'SC', consumer: 'search')).to be true
      expect(described_class.serves_state?(company, 'PR', consumer: 'search')).to be false
    end
  end
end
