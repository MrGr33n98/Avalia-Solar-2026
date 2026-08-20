# frozen_string_literal: true

class SocialFollow < ApplicationRecord
  belongs_to :follower, class_name: 'User'
  belongs_to :followable, polymorphic: true

  validates :follower_id, uniqueness: { scope: %i[followable_type followable_id], message: 'já segue esta entidade' }
  validate :cannot_follow_self

  private

  def cannot_follow_self
    return unless followable_type == 'ReviewerProfile' && followable&.user_id == follower_id

    errors.add(:follower_id, 'não pode seguir a si próprio')
  end
end
