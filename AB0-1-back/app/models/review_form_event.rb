class ReviewFormEvent < ApplicationRecord
  EVENT_TYPES = %w[
    form_viewed qr_scanned review_started review_submitted link_copied
    qr_downloaded whatsapp_clicked
  ].freeze

  belongs_to :company
  belongs_to :review_form

  validates :event_type, inclusion: { in: EVENT_TYPES }
  validates :source, presence: true
end
