class ReviewerPublicationEvent < ApplicationRecord
  belongs_to :reviewer_publication
  belongs_to :user, optional: true
  EVENT_NAMES = %w[publication_view publication_share publication_comment publication_lead publication_publish].freeze
  validates :event_name, inclusion: { in: EVENT_NAMES }
end
