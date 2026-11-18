# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AchievementBadge, type: :model do
  describe 'validations' do
    subject { build(:achievement_badge) }

    it { is_expected.to validate_presence_of(:slug) }
    it { is_expected.to validate_uniqueness_of(:slug) }
    it { is_expected.to validate_presence_of(:name) }
    it { is_expected.to validate_presence_of(:description) }
    it { is_expected.to validate_presence_of(:category) }
    it { is_expected.to validate_inclusion_of(:category).in_array(AchievementBadge::CATEGORIES) }
    it { is_expected.to validate_presence_of(:tier) }
    it { is_expected.to validate_inclusion_of(:tier).in_array(AchievementBadge::TIERS) }
    it { is_expected.to validate_numericality_of(:points_xp).is_greater_than_or_equal_to(0) }
    it { is_expected.to validate_numericality_of(:threshold).is_greater_than(0) }
    it { is_expected.to validate_inclusion_of(:action_enum).in_array(AchievementBadge::ACTIONS) }
    it { is_expected.to validate_presence_of(:earned_asset_path) }
    it { is_expected.to validate_presence_of(:locked_asset_path) }
  end

  describe 'associations' do
    it { is_expected.to have_many(:user_achievements).dependent(:destroy) }
    it { is_expected.to have_many(:users).through(:user_achievements) }
    it { is_expected.to have_many(:achievement_ledgers).dependent(:restrict_with_error) }
  end

  describe 'scopes' do
    let!(:active_badge) { create(:achievement_badge, active: true, position: 2) }
    let!(:inactive_badge) { create(:achievement_badge, active: false, position: 1) }

    it 'filters only active badges' do
      expect(described_class.active).to include(active_badge)
      expect(described_class.active).not_to include(inactive_badge)
    end

    it 'orders badges by position and id' do
      expect(described_class.ordered.pluck(:id)).to eq([inactive_badge.id, active_badge.id])
    end
  end
end
