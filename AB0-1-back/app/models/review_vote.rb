# frozen_string_literal: true

class ReviewVote < ApplicationRecord
  belongs_to :user
  belongs_to :review

  after_commit :enqueue_gamification_reevaluation, on: %i[create destroy], if: :useful_vote?

  private

  def useful_vote?
    vote_type == 'useful' && review&.user_id.present?
  end

  def enqueue_gamification_reevaluation
    Gamification::ReevaluateUserJob.perform_later(review.user_id, 'useful_vote_changed')
  end
end
