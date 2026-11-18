# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gamification::ReevaluateUserJob, type: :job do
  let(:user) { create(:user) }
  let(:badge) { create(:achievement_badge, slug: 'test_badge', points_xp: 50) }

  describe '#perform' do
    it 'calls EvaluateAchievementsService with user_id and trigger_cause' do
      expect(Gamification::EvaluateAchievementsService).to receive(:call)
        .with(user_id: user.id, trigger_cause: 'manual_trigger')
        .and_return(double(success?: true, unlocked_badges: [], user: user))

      described_class.perform_now(user.id, 'manual_trigger')
    end

    it 'delivers notification when new achievements are unlocked' do
      user_achievement = create(:user_achievement, user: user, achievement_badge: badge)
      result = Gamification::EvaluateAchievementsService::Result.new(
        success?: true,
        user: user,
        unlocked_badges: [badge],
        revoked_badges: [],
        reinstated_badges: [],
        total_xp: 50
      )

      allow(Gamification::EvaluateAchievementsService).to receive(:call).and_return(result)

      notifier_double = instance_double(AchievementUnlockedNotifier)
      allow(AchievementUnlockedNotifier).to receive(:with)
        .with(achievement_badge: badge, user_achievement: user_achievement)
        .and_return(notifier_double)

      expect(notifier_double).to receive(:deliver_later).with(user)

      described_class.perform_now(user.id, 'review_approved')
    end

    it 'does not deliver notifications when result fails' do
      allow(Gamification::EvaluateAchievementsService).to receive(:call)
        .and_return(double(success?: false, error: 'User not found'))

      expect(AchievementUnlockedNotifier).not_to receive(:with)

      described_class.perform_now(999_999, 'trigger')
    end
  end
end
