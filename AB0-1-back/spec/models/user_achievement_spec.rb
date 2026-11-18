# frozen_string_literal: true

require 'rails_helper'

RSpec.describe UserAchievement, type: :model do
  describe 'validations' do
    subject { build(:user_achievement) }

    it { is_expected.to validate_presence_of(:user_id) }
    it { is_expected.to validate_presence_of(:achievement_badge_id) }
    it { is_expected.to validate_uniqueness_of(:achievement_badge_id).scoped_to(:user_id) }
    it { is_expected.to validate_presence_of(:state) }
    it { is_expected.to validate_inclusion_of(:state).in_array(UserAchievement::STATES) }
    it { is_expected.to validate_presence_of(:unlocked_at) }
    it { is_expected.to validate_uniqueness_of(:share_token) }
  end

  describe 'associations' do
    it { is_expected.to belong_to(:user) }
    it { is_expected.to belong_to(:achievement_badge) }
  end

  describe 'token generation and defaults' do
    let(:user) { create(:user) }
    let(:badge) { create(:achievement_badge) }

    it 'generates a unique share token automatically on create' do
      ua = described_class.create!(user: user, achievement_badge: badge)
      expect(ua.share_token).to be_present
      expect(ua.state).to eq('unlocked')
      expect(ua.unlocked_at).to be_present
    end
  end

  describe 'status transitions' do
    let(:user_achievement) { create(:user_achievement, state: 'unlocked') }

    it 'revokes an unlocked achievement' do
      expect { user_achievement.revoke! }
        .to change(user_achievement, :state).from('unlocked').to('revoked')
        .and change(user_achievement, :revoked_at).from(nil)
      expect(user_achievement).to be_revoked
    end

    it 'reinstates a revoked achievement' do
      user_achievement.revoke!
      expect { user_achievement.reinstate! }
        .to change(user_achievement, :state).from('revoked').to('unlocked')
        .and change(user_achievement, :revoked_at).to(nil)
      expect(user_achievement).to be_unlocked
    end
  end
end
