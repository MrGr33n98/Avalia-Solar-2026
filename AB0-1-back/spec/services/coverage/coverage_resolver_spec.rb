# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Coverage::CoverageResolver do
  let(:company) do
    OpenStruct.new(
      id: 42,
      name: 'Solar Test Ltda',
      city: 'Florianópolis',
      state: 'SC',
      company_service_areas: service_areas
    )
  end

  describe '#resolve' do
    context 'with explicit national coverage' do
      let(:service_areas) do
        [OpenStruct.new(coverage_type: 'national', is_active: true)]
      end

      it 'resolves national coverage for any state or city' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'Cuiabá', target_state: 'MT')

        expect(result.covered?).to be true
        expect(result.match_basis).to eq(:national)
        expect(result.source).to eq(:company_service_area)
        expect(result.authorized_for?(:ranking)).to be true
      end
    end

    context 'with explicit state coverage' do
      let(:service_areas) do
        [OpenStruct.new(coverage_type: 'state', state_code: 'SC', is_active: true)]
      end

      it 'resolves state coverage for matching state and any city within it' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'Joinville', target_state: 'SC')

        expect(result.covered?).to be true
        expect(result.match_basis).to eq(:state)
        expect(result.authorized_for?(:ranking)).to be true
      end

      it 'returns not_covered for a different state' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'Curitiba', target_state: 'PR')

        expect(result.covered?).to be false
        expect(result.status).to eq(:not_covered)
      end
    end

    context 'with explicit city coverage' do
      let(:service_areas) do
        [
          OpenStruct.new(coverage_type: 'city', state_code: 'SC', city_name: 'Florianópolis', is_active: true),
          OpenStruct.new(coverage_type: 'city', state_code: 'SC', city_name: 'Blumenau', is_active: false)
        ]
      end

      it 'resolves active city coverage with accent-insensitive matching' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'florianopolis', target_state: 'SC')

        expect(result.covered?).to be true
        expect(result.match_basis).to eq(:city)
      end

      it 'ignores inactive city coverage' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'Blumenau', target_state: 'SC')

        expect(result.covered?).to be false
      end
    end

    context 'with radius coverage' do
      let(:service_areas) do
        [OpenStruct.new(coverage_type: 'radius', state_code: 'SC', radius_km: 100, is_active: true)]
      end

      it 'returns unsupported as territorial proof for ranking' do
        resolver = described_class.new(company, purpose: :ranking)
        result = resolver.resolve(target_city: 'Joinville', target_state: 'SC')

        expect(result.unsupported?).to be true
        expect(result.status).to eq(:unsupported)
        expect(result.reason).to eq(:radius_unsupported_as_territorial_proof)
        expect(result.authorized_for?(:ranking)).to be false
      end
    end
  end
end
