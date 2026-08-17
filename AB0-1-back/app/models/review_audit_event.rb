class ReviewAuditEvent < ApplicationRecord
  EVENT_TYPES = %w[
    reply_created
    reply_updated
    reply_deleted
    moderation_changed
    verification_changed
    review_contested
    media_moderation_changed
  ].freeze

  belongs_to :review
  belongs_to :actor, polymorphic: true, optional: true

  validates :event_type, inclusion: { in: EVENT_TYPES }

  scope :chronological, -> { order(created_at: :asc, id: :asc) }

  def actor_name
    return 'Sistema' unless actor

    actor.try(:name).presence || actor.try(:email).presence || actor.class.name
  end
end
