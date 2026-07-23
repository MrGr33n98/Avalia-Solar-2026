# frozen_string_literal: true

require 'rails_helper'

RSpec.describe CompanyServiceArea, type: :model do
  let(:company) { create(:company) }

  describe 'validations and normalization' do
    it 'uppercases state_code before validation' do
      service_area = described_class.new(
        company: company,
        coverage_type: 'state',
        state_code: 'sc'
      )
      service_area.valid?
      expect(service_area.state_code).to eq('SC')
    end

    it 'validates allowed coverage types' do
      invalid = described_class.new(company: company, coverage_type: 'invalid_type', state_code: 'SC')
      expect(invalid).not_to be_valid
      expect(invalid.errors[:coverage_type]).to be_present
    end

    it 'requires city_name for city coverage' do
      service_area = described_class.new(company: company, coverage_type: 'city', state_code: 'SC', city_name: nil)
      expect(service_area).not_to be_valid
      expect(service_area.errors[:city_name]).to be_present
    end

    it 'requires radius_km for radius coverage' do
      service_area = described_class.new(company: company, coverage_type: 'radius', state_code: 'SC', radius_km: nil)
      expect(service_area).not_to be_valid
      expect(service_area.errors[:radius_km]).to be_present
    end
  end

  describe '#covers?' do
    it 'returns true for national coverage regardless of location' do
      area = described_class.new(company: company, coverage_type: 'national', is_active: true)
      expect(area.covers?(city: 'Florianópolis', state: 'SC')).to be true
      expect(area.covers?(city: 'São Paulo', state: 'SP')).to be true
    end

    it 'returns true for state coverage when state matches' do
      area = described_class.new(company: company, coverage_type: 'state', state_code: 'SC', is_active: true)
      expect(area.covers?(city: 'Florianópolis', state: 'SC')).to be true
      expect(area.covers?(city: 'Curitiba', state: 'PR')).to be false
    end

    it 'returns true for city coverage when both city and state match' do
      area = described_class.new(company: company, coverage_type: 'city', state_code: 'SC', city_name: 'Florianópolis', is_active: true)
      expect(area.covers?(city: 'Florianópolis', state: 'SC')).to be true
      expect(area.covers?(city: 'Blumenau', state: 'SC')).to be false
    end

    it 'returns true for radius coverage when state matches' do
      area = described_class.new(company: company, coverage_type: 'radius', state_code: 'SC', radius_km: 100, is_active: true)
      expect(area.covers?(city: nil, state: 'SC')).to be true
      expect(area.covers?(city: 'Florianópolis', state: 'SC')).to be true
      expect(area.covers?(city: 'São Paulo', state: 'SP')).to be false
    end

    it 'returns false if is_active is false' do
      area = described_class.new(company: company, coverage_type: 'national', is_active: false)
      expect(area.covers?(city: 'Florianópolis', state: 'SC')).to be false
    end
  end
end
