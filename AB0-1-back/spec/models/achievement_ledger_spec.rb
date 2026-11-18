# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AchievementLedger, type: :model do
  describe 'validations' do
    subject { build(:achievement_ledger) }

    it { is_expected.to validate_presence_of(:user_id) }
    it { is_expected.to validate_presence_of(:achievement_badge_id) }
    it { is_expected.to validate_presence_of(:kind) }
    it { is_expected.to validate_inclusion_of(:kind).in_array(AchievementLedger::KINDS) }
    it { is_expected.to validate_presence_of(:xp_delta) }
    it { is_expected.to validate_numericality_of(:xp_delta).only_integer }
    it { is_expected.to validate_presence_of(:idempotency_key) }
    it { is_expected.to validate_uniqueness_of(:idempotency_key) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:achievement_badge) }
    it { is_expected.to belong_to(:admin_user).optional }
  end
end
