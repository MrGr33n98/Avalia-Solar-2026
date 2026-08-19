# frozen_string_literal: true

class SocialFollow < ApplicationRecord
  belongs_to :follower, class_name: 'User'
  belongs_to :followable, polymorphic: true

  validates :follower_id, uniqueness: { scope: %i[followable_type followable_id], message: 'já segue esta entidade' }
end
