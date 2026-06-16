class DirectMessage < ApplicationRecord
  belongs_to :conversation

  validates :body, presence: true
  validates :sender_type, inclusion: { in: %w[User Company] }
end
