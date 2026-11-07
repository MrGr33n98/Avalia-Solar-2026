class VoiceReviewEvent < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session, optional: true
  belongs_to :voice_review_invite, optional: true
  belongs_to :company

  before_validation { self.id ||= SecureRandom.uuid }
  validates :event_name, :dedupe_key, :occurred_at, presence: true
end
