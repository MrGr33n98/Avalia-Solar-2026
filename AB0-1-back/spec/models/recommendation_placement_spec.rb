# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RecommendationPlacement, type: :model do
  let(:company) { create(:company) }

  describe 'validations and normalization' do
    it 'uppercases state_code before validation' do
      placement = described_class.new(
        company: company,
        placement_type: 'sponsored',
        state_code: 'sc',
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )
      placement.valid?
      expect(placement.state_code).to eq('SC')
    end

    it 'validates placement_type inclusion' do
      invalid = described_class.new(
        company: company,
        placement_type: 'invalid',
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )
      expect(invalid).not_to be_valid
      expect(invalid.errors[:placement_type]).to be_present
    end

    it 'validates positive slot_position' do
      invalid = described_class.new(
        company: company,
        placement_type: 'sponsored',
        slot_position: 0,
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )
      expect(invalid).not_to be_valid
      expect(invalid.errors[:slot_position]).to be_present
    end

    it 'validates ends_at is after starts_at' do
      invalid = described_class.new(
        company: company,
        placement_type: 'sponsored',
        starts_at: Time.current,
        ends_at: 1.hour.ago
      )
      expect(invalid).not_to be_valid
      expect(invalid.errors[:ends_at]).to be_present
    end
  end

  describe '#active_for?' do
    it 'returns true for an active placement within dates' do
      placement = described_class.new(
        company: company,
        placement_type: 'sponsored',
        active: true,
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now
      )
      expect(placement.active_for?).to be true
    end

    it 'returns false if inactive or expired' do
      expired = described_class.new(
        company: company,
        placement_type: 'sponsored',
        active: true,
        starts_at: 5.days.ago,
        ends_at: 1.day.ago
      )
      expect(expired.active_for?).to be false
      expect(expired.expired?).to be true
    end

    it 'returns false if current_impressions reaches max_impressions' do
      placement = described_class.new(
        company: company,
        placement_type: 'sponsored',
        active: true,
        starts_at: 1.day.ago,
        ends_at: 1.day.from_now,
        max_impressions: 100,
        current_impressions: 100
      )
      expect(placement.active_for?).to be false
    end
  end
end
