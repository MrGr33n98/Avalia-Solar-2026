class VoiceReviewPublication < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session
  belongs_to :review
  belongs_to :voice_review_transcript

  validates :confirmed_text, length: { in: 5..500 }
  validates :rating, inclusion: { in: 1..5 }
  validates :name_mode, inclusion: { in: %w[anonymous initials full_name] }

  before_validation :ensure_id

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
