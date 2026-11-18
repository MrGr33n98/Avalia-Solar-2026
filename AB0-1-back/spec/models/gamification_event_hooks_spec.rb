# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Gamification Event Hooks', type: :model do
  include ActiveJob::TestHelper

  let(:user) { create(:user) }
  let(:company) { create(:company) }

  describe 'Review hooks' do
    it 'sets approved_at timestamp when review is approved' do
      review = build(:review, user: user, company: company, status: :approved, approved_at: nil)
      review.save!
      expect(review.approved_at).to be_present
    end

    it 'enqueues ReevaluateUserJob on review status change' do
      review = create(:review, user: user, company: company, status: :pending)

      expect do
        review.update!(status: :approved)
      end.to have_enqueued_job(Gamification::ReevaluateUserJob)
        .with(user.id, 'review_status_changed')
    end

    it 'enqueues ReevaluateUserJob when review is destroyed' do
      review = create(:review, user: user, company: company, status: :approved)

      expect do
        review.destroy!
      end.to have_enqueued_job(Gamification::ReevaluateUserJob)
        .with(user.id, 'review_status_changed')
    end
  end

  describe 'ReviewVote hooks' do
    let(:review) { create(:review, user: user, company: company, status: :approved) }
    let(:voter) { create(:user) }

    it 'enqueues ReevaluateUserJob for review author on useful vote create' do
      expect do
        ReviewVote.create!(user: voter, review: review, vote_type: 'useful')
      end.to have_enqueued_job(Gamification::ReevaluateUserJob)
        .with(user.id, 'useful_vote_changed')
    end
  end

  describe 'ReviewerSolution hooks' do
    it 'enqueues ReevaluateUserJob on solution create' do
      expect do
        ReviewerSolution.create!(
          user: user,
          name: 'Painel Canadian 550W',
          solution_type: 'product',
          category: 'solar_panel',
          status: 'active'
        )
      end.to have_enqueued_job(Gamification::ReevaluateUserJob)
        .with(user.id, 'solution_changed')
    end
  end

  describe 'User hooks' do
    it 'enqueues ReevaluateUserJob on profile update' do
      expect do
        user.update!(city: 'Campinas', state: 'SP')
      end.to have_enqueued_job(Gamification::ReevaluateUserJob)
        .with(user.id, 'profile_updated')
    end
  end
end
