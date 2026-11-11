require 'rails_helper'
require 'sidekiq/testing'

Sidekiq::Testing.fake!

RSpec.describe Review, type: :model do
  describe 'event broadcasting' do
    let(:review) { create(:review, status: :pending) }

    context 'when review status transitions to approved' do
      it 'instruments review.published event' do
        events = []
        callback = ->(_name, _start, _finish, _id, payload) { events << payload }
        ActiveSupport::Notifications.subscribed(callback, 'review.published') do
          review.update!(status: :approved)
        end

        expect(events.first).to include(review_id: review.id)
      end
    end

    context 'when review is created as approved' do
      it 'instruments review.published event' do
        events = []
        callback = ->(_name, _start, _finish, _id, payload) { events << payload }
        review_approved = nil
        ActiveSupport::Notifications.subscribed(callback, 'review.published') do
          review_approved = create(:review, status: :approved)
        end

        expect(events.first).to include(review_id: review_approved.id)
      end
    end

    context 'when review status transitions to rejected' do
      it 'does not instrument review.published event' do
        events = []
        callback = ->(_name, _start, _finish, _id, payload) { events << payload }
        ActiveSupport::Notifications.subscribed(callback, 'review.published') do
          review.update!(status: :rejected)
        end

        expect(events).to be_empty
      end
    end

    context 'when review is updated but status remains approved' do
      it 'does not instrument review.published event again' do
        approved_review = create(:review, status: :approved)
        events = []
        callback = ->(_name, _start, _finish, _id, payload) { events << payload }
        ActiveSupport::Notifications.subscribed(callback, 'review.published') do
          approved_review.update!(comment: 'Updated comment but same status')
        end

        expect(events).to be_empty
      end
    end
  end
end
