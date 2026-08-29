# frozen_string_literal: true

class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :post, optional: true
  belongs_to :commentable, polymorphic: true, optional: true
  belongs_to :parent, class_name: 'Comment', optional: true
  has_many :replies, class_name: 'Comment', foreign_key: :parent_id, dependent: :destroy

  validates :body, presence: true, length: { maximum: 2000 }
  validates :status, presence: true, inclusion: { in: %w[active hidden deleted] }

  scope :active, -> { where(status: 'active') }
  scope :root_comments, -> { where(parent_id: nil) }

  after_save :update_group_post_counter, if: -> { commentable_type == 'GroupPost' }
  after_destroy :update_group_post_counter, if: -> { commentable_type == 'GroupPost' }
  after_commit :reconcile_feed_stats

  private

  def update_group_post_counter
    return unless commentable.is_a?(GroupPost)

    active_count = commentable.comments.where(status: 'active').count
    commentable.update_columns(comments_count: active_count)
  end

  def reconcile_feed_stats
    Feed::StatsReconciler.call(commentable) if commentable
  end
end
