# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Gamification::Rules::ReviewApprovedCountRule, type: :service do
  let(:user) { create(:user) }
  let(:badge_one) { create(:achievement_badge, slug: 'review_approved_1', threshold: 1) }
  let(:badge_three) { create(:achievement_badge, slug: 'review_approved_3', threshold: 3) }

  describe '#evaluate' do
    it 'returns [false, nil] when threshold is not reached' do
      rule = described_class.new(badge_one)
      eligible, fact_at = rule.evaluate(user)

      expect(eligible).to be false
      expect(fact_at).to be_nil
    end

    it 'returns [true, timestamp] when threshold is met' do
      review = create(:review, user: user, status: :approved, approved_at: 2.hours.ago)
      rule = described_class.new(badge_one)
      eligible, fact_at = rule.evaluate(user)

      expect(eligible).to be true
      expect(fact_at).to be_within(1.second).of(review.approved_at)
    end

    it 'ignores pending or rejected reviews' do
      create(:review, user: user, status: :pending)
      create(:review, user: user, status: :rejected)

      rule = described_class.new(badge_one)
      eligible, _fact_at = rule.evaluate(user)

      expect(eligible).to be false
    end
  end
end
