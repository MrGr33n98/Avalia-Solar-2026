# frozen_string_literal: true

require 'rails_helper'

RSpec.describe AchievementUnlockedNotifier do
  let(:user) { create(:user) }
  let(:badge) { create(:achievement_badge, name: '1º Login', points_xp: 20) }
  let(:user_achievement) { create(:user_achievement, user: user, achievement_badge: badge) }

  subject(:notifier) do
    described_class.with(achievement_badge: badge, user_achievement: user_achievement)
  end

  it 'formats notification message with badge name and points' do
    expect(notifier.message).to eq("Parabéns! Você desbloqueou a conquista '1º Login' (+20 XP).")
  end

  it 'directs to review dashboard achievements url' do
    expect(notifier.url).to eq('/review-dashboard/achievements')
  end
end
