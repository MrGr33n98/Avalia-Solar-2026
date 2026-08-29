class UserInterest < ApplicationRecord
  belongs_to :user

  validates :entity_type, :entity_id, :last_interaction_at, presence: true
  validates :entity_id, numericality: { only_integer: true }
end
