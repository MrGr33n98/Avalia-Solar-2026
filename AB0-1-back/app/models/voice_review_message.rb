class VoiceReviewMessage < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_session, optional: true
  has_many :voice_review_consents, dependent: :nullify

  validates :provider, :provider_message_id, :message_type, :payload_digest, presence: true

  before_validation :ensure_id

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
