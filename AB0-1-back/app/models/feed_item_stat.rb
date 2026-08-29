# frozen_string_literal: true

class FeedItemStat < ApplicationRecord
  WEIGHTS = { reactions_count: 1, comments_count: 3, saves_count: 4, shares_count: 5 }.freeze

  validates :subject_type, :subject_id, presence: true
  validates :subject_id, uniqueness: { scope: :subject_type }

  def self.recalculate!(record)
    subject_type = record.class.base_class.name
    subject_id = record.id
    counts = {
      reactions_count: Reaction.where(reactable_type: subject_type, reactable_id: subject_id).count,
      comments_count: Comment.where(commentable_type: subject_type, commentable_id: subject_id, status: 'active').count,
      saves_count: SavedItem.where(saveable_type: subject_type, saveable_id: subject_id).count,
      shares_count: publication_event_count(subject_type, subject_id, 'publication_share'),
      views_count: publication_event_count(subject_type, subject_id, 'publication_view')
    }
    stat = find_or_initialize_by(subject_type: subject_type, subject_id: subject_id)
    stat.assign_attributes(counts.merge(engagement_score: counts.sum { |key, value| value * WEIGHTS.fetch(key, 0) }, last_engagement_at: Time.current))
    stat.save!
  end

  def self.publication_event_count(subject_type, subject_id, event_name)
    return 0 unless subject_type == 'ReviewerPublication'

    ReviewerPublicationEvent.where(reviewer_publication_id: subject_id, event_name: event_name).count
  end
end
