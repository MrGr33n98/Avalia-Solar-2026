class VoiceReviewTranscript < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session
  belongs_to :voice_review_asset

  before_validation :ensure_id
  validates :provider, :model_id, :private_raw_text, presence: true

  def text
    private_raw_text
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
