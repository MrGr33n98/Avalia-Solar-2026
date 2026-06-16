class Conversation < ApplicationRecord
  belongs_to :user
  belongs_to :company
  has_many :direct_messages, dependent: :destroy

  validates :user_id, uniqueness: { scope: :company_id }
end
