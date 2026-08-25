# frozen_string_literal: true

class Reaction < ApplicationRecord
  belongs_to :user
  belongs_to :reactable, polymorphic: true

  validates :reaction_type, presence: true
  validates :user_id, uniqueness: { scope: %i[reactable_type reactable_id], message: 'já reagiu a este item' }

  after_save :update_group_post_counter, if: -> { reactable_type == 'GroupPost' }
  after_destroy :update_group_post_counter, if: -> { reactable_type == 'GroupPost' }

  private

  def update_group_post_counter
    return unless reactable.is_a?(GroupPost)

    active_count = reactable.reactions.count
    reactable.update_columns(reactions_count: active_count)
  end
end
