# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gamification::EvaluateAchievementsService, type: :service do
  let(:user) { create(:user) }
  let!(:badge_review_one) do
    create(
      :achievement_badge,
      slug: 'review_approved_1',
      metric_key: 'approved_reviews_count',
      threshold: 1,
      points_xp: 50,
      revocable: true,
      active: true
    )
  end
  let!(:badge_review_three) do
    create(
      :achievement_badge,
      slug: 'review_approved_3',
      metric_key: 'approved_reviews_count',
      threshold: 3,
      points_xp: 100,
      revocable: true,
      active: true
    )
  end

  describe '#call' do
    context 'when user has 0 approved reviews' do
      it 'does not unlock any badges and leaves ledger empty' do
        result = described_class.call(user_id: user.id)

        expect(result.success?).to be true
        expect(result.unlocked_badges).to be_empty
        expect(user.user_achievements.count).to eq(0)
        expect(user.total_achievement_xp).to eq(0)
      end
    end

    context 'when user has 1 approved review' do
      let!(:review) do
        create(:review, user: user, status: :approved, approved_at: 1.day.ago)
      end

      it 'unlocks 1st review badge and credits 50 XP' do
        result = described_class.call(user_id: user.id)

        expect(result.success?).to be true
        expect(result.unlocked_badges.map(&:slug)).to contain_exactly('review_approved_1')
        expect(user.user_achievements.unlocked.count).to eq(1)
        expect(user.total_achievement_xp).to eq(50)

        ledger_entry = AchievementLedger.last
        expect(ledger_entry.user).to eq(user)
        expect(ledger_entry.achievement_badge).to eq(badge_review_one)
        expect(ledger_entry.kind).to eq('unlocked')
        expect(ledger_entry.xp_delta).to eq(50)
      end

      it 'is strictly idempotent on repeated calls' do
        described_class.call(user_id: user.id)
        expect(user.total_achievement_xp).to eq(50)
        expect(AchievementLedger.count).to eq(1)

        result2 = described_class.call(user_id: user.id)
        expect(result2.success?).to be true
        expect(result2.unlocked_badges).to be_empty
        expect(user.total_achievement_xp).to eq(50)
        expect(AchievementLedger.count).to eq(1)
      end
    end

    context 'when user loses eligibility for a revocable badge' do
      let!(:review) do
        create(:review, user: user, status: :approved, approved_at: 1.day.ago)
      end

      before do
        described_class.call(user_id: user.id)
        expect(user.total_achievement_xp).to eq(50)
      end

      it 'revokes the badge and posts a compensating negative XP delta in ledger' do
        review.update!(status: :rejected)

        result = described_class.call(user_id: user.id)
        expect(result.success?).to be true
        expect(result.revoked_badges.map(&:slug)).to contain_exactly('review_approved_1')
        expect(user.user_achievements.revoked.count).to eq(1)
        expect(user.total_achievement_xp).to eq(0)

        expect(AchievementLedger.count).to eq(2)
        revocation_entry = AchievementLedger.last
        expect(revocation_entry.kind).to eq('revoked')
        expect(revocation_entry.xp_delta).to eq(-50)
      end
    end

    context 'when user regains eligibility after revocation' do
      let!(:review) do
        create(:review, user: user, status: :approved, approved_at: 1.day.ago)
      end

      before do
        described_class.call(user_id: user.id)
        review.update!(status: :rejected)
        described_class.call(user_id: user.id)
        expect(user.total_achievement_xp).to eq(0)
      end

      it 'reinstates the badge and credits XP back' do
        review.update!(status: :approved)

        result = described_class.call(user_id: user.id)
        expect(result.success?).to be true
        expect(result.reinstated_badges.map(&:slug)).to contain_exactly('review_approved_1')
        expect(user.user_achievements.unlocked.count).to eq(1)
        expect(user.total_achievement_xp).to eq(50)

        expect(AchievementLedger.count).to eq(3)
        reinstate_entry = AchievementLedger.last
        expect(reinstate_entry.kind).to eq('reinstated')
        expect(reinstate_entry.xp_delta).to eq(50)
      end
    end
  end
end
