class PollVote < ApplicationRecord
  belongs_to :poll
  belongs_to :poll_option
  belongs_to :user
  validates :user_id, uniqueness: { scope: :poll_id }
  validate :option_belongs_to_poll
  after_create_commit :increment_option_votes

  private

  def option_belongs_to_poll
    errors.add(:poll_option, 'não pertence à enquete') unless poll_option&.poll_id == poll_id
  end

  def increment_option_votes
    PollOption.where(id: poll_option_id).update_all('votes_count = votes_count + 1')
  end
end
