# frozen_string_literal: true

class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :reactable, polymorphic: true

  validates :reaction_type, presence: true
  validates :user_id, uniqueness: { scope: %i[reactable_type reactable_id], message: 'já reagiu a este item' }
end
