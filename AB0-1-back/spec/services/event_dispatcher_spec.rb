require 'rails_helper'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe EventDispatcher do
  describe '.dispatch' do
    let(:review_id) { 123 }
    let(:payload) { { review_id: review_id } }

    context 'when event is review.published' do
      it 'enqueues TrustScoreRecalculationWorker and AiModerationWorker' do
        expect {
          described_class.dispatch('review.published', nil, nil, nil, payload)
        }.to change(TrustScoreRecalculationWorker.jobs, :size).by(1)
        .and change(AiModerationWorker.jobs, :size).by(1)

        expect(TrustScoreRecalculationWorker.jobs.last['args']).to eq([review_id])
        expect(AiModerationWorker.jobs.last['args']).to eq([review_id])
      end
    end

    context 'when event is unknown' do
      it 'does nothing' do
        expect {
          described_class.dispatch('unknown.event', nil, nil, nil, payload)
        }.not_to change(TrustScoreRecalculationWorker.jobs, :size)
      end
    end
  end
end
