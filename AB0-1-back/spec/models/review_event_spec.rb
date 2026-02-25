require 'rails_helper'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe Review, type: :model do
  describe 'event broadcasting' do
    before do
      allow(ActiveSupport::Notifications).to receive(:instrument).and_call_original
    end

    let(:review) { create(:review, status: :pending) }

    context 'when review status transitions to approved' do
      it 'instruments review.published event' do
        expect(ActiveSupport::Notifications).to receive(:instrument).with('review.published',
                                                                          hash_including(review_id: review.id))

        review.update!(status: :approved)
      end
    end

    context 'when review is created as approved' do
      it 'instruments review.published event' do
        review_approved = build(:review, status: :approved)
        expect(ActiveSupport::Notifications).to receive(:instrument).with('review.published',
                                                                          hash_including(review_id: anything))

        review_approved.save!
      end
    end

    context 'when review status transitions to rejected' do
      it 'does not instrument review.published event' do
        expect(ActiveSupport::Notifications).not_to receive(:instrument).with('review.published', any_args)

        review.update!(status: :rejected)
      end
    end

    context 'when review is updated but status remains approved' do
      it 'does not instrument review.published event again' do
        approved_review = create(:review, status: :approved)

        expect(ActiveSupport::Notifications).not_to receive(:instrument).with('review.published', any_args)
        approved_review.update!(comment: 'Updated comment but same status')
      end
    end
  end
end
