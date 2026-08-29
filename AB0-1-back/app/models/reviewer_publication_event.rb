class ReviewerPublicationEvent < ApplicationRecord
  belongs_to :reviewer_publication
  belongs_to :user, optional: true
  EVENT_NAMES = %w[publication_view publication_share publication_comment publication_lead publication_publish].freeze
  validates :event_name, inclusion: { in: EVENT_NAMES }

  after_create_commit :increment_publication_counter
  after_create_commit :reconcile_feed_stats

  private

  def increment_publication_counter
    return unless %w[publication_view publication_share].include?(event_name)

    column = event_name == 'publication_view' ? :views_count : :shares_count
    reviewer_publication.class.increment_counter(column, reviewer_publication_id)
  end

  def reconcile_feed_stats
    Feed::StatsReconciler.call(reviewer_publication)
  end
end
