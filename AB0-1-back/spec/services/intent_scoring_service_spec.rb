require 'rails_helper'

RSpec.describe IntentScoringService, type: :service do
  let(:company) { create(:company) }
  let(:anonymous_id) { 'anon-123' }

  describe '#calculate!' do
    context 'when there are no activities' do
      it 'returns a cold score with zero points' do
        score = described_class.new(company.id, anonymous_id: anonymous_id).calculate!

        expect(score.total_score).to eq(0)
        expect(score.intent_level).to eq('cold')
        expect(score.anonymous_id).to eq(anonymous_id)
        expect(score.total_signals_count).to eq(0)
      end
    end

    context 'when there are strong contact and financial signals' do
      before do
        3.times do
          create(
            :buyer_intent_activity,
            company: company,
            anonymous_id: anonymous_id,
            session_id: 'session-1',
            signal_type: 'copy_clipboard',
            signal_category: 'contact_intent',
            element_type: 'phone',
            tracked_at: 1.hour.ago
          )
        end

        create(
          :buyer_intent_activity,
          company: company,
          anonymous_id: anonymous_id,
          session_id: 'session-1',
          signal_type: 'calculator_usage',
          signal_category: 'financial_intent',
          element_type: 'calculator',
          tracked_at: 30.minutes.ago
        )
      end

      it 'scores the lead as hot or above' do
        score = described_class.new(company.id, anonymous_id: anonymous_id).calculate!

        expect(score.total_score).to be >= 50
        expect(score).to be_hot
        expect(score.hot_signals_count).to eq(4)
        expect(score.confidence_score).to be > 0.0
      end

      it 'creates a history record when the score changes' do
        score = described_class.new(company.id, anonymous_id: anonymous_id).calculate!

        expect(score.histories.count).to eq(1)
        expect(score.histories.first.score_before).to eq(0)
        expect(score.histories.first.score_after).to eq(score.total_score)
      end
    end

    context 'when all activity is stale' do
      before do
        create(
          :buyer_intent_activity,
          company: company,
          anonymous_id: anonymous_id,
          signal_type: 'hover_intent',
          signal_category: 'micro_interaction',
          tracked_at: 30.days.ago
        )
      end

      it 'applies temporal decay to the resulting score' do
        score = described_class.new(company.id, anonymous_id: anonymous_id).calculate!

        expect(score.total_score).to be < 10
        expect(score.decay_factor).to be < 0.1
      end
    end
  end
end
