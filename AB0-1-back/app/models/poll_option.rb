class PollOption < ApplicationRecord
  belongs_to :poll
  has_many :poll_votes, dependent: :restrict_with_exception
  validates :label, presence: true
end
