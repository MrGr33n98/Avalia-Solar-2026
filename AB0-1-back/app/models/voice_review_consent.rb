class VoiceReviewConsent < ApplicationRecord
  self.primary_key = 'id'

  PURPOSES = %w[process_audio publish_text display_full_name publish_audio].freeze
  belongs_to :voice_review_session
  belongs_to :voice_review_message, optional: true

  before_validation :ensure_id
  validates :purpose, inclusion: { in: PURPOSES }, presence: true
  validates :policy_version, :granted_at, presence: true

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end
end
