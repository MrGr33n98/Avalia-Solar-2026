# frozen_string_literal: true

class SavedItem < ApplicationRecord
  belongs_to :user
  belongs_to :saveable, polymorphic: true

  validates :user_id, uniqueness: { scope: %i[saveable_type saveable_id], message: 'já salvou este item' }
  after_commit :reconcile_feed_stats

  private

  def reconcile_feed_stats
    Feed::StatsReconciler.call(saveable) if saveable
  end
end
