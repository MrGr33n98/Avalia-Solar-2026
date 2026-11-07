class VoiceReviewSession < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :voice_review_invite
  belongs_to :company
  belongs_to :review_form
  belongs_to :published_review, class_name: 'Review', optional: true
  has_many :voice_review_messages, dependent: :destroy
  has_many :voice_review_assets, dependent: :destroy
  has_many :voice_review_transcripts, dependent: :destroy
  has_many :voice_review_consents, dependent: :destroy
  has_one :voice_review_publication, dependent: :destroy

  STATES = %w[opened awaiting_consent awaiting_audio audio_received transcribing awaiting_confirmation draft_confirmed
              submitted completed expired revoked abandoned failed_retryable failed_permanent needs_human_review].freeze
  enum state: STATES.index_with(&:to_s)

  before_validation :ensure_id

  validates :provider_contact_hash, :provider_contact_ciphertext, :session_token_digest, :expires_at, presence: true
  validates :provider_chat_id, presence: true, if: -> { provider == 'waha' }
  validates :state, inclusion: { in: STATES }

  def active_now?
    !%w[completed expired revoked abandoned failed_permanent].include?(state) && expires_at.future?
  end

  def token_matches?(raw_token)
    return false if raw_token.blank?

    ActiveSupport::SecurityUtils.secure_compare(session_token_digest, self.class.digest_token(raw_token))
  rescue ArgumentError
    false
  end

  def latest_transcript
    voice_review_transcripts.order(version: :desc).first
  end

  def issue_new_token!
    token = SecureRandom.urlsafe_base64(32)
    update!(session_token_digest: self.class.digest_token(token))
    self.raw_session_token = token
    token
  end

  def provider_contact
    encryptor.decrypt_and_verify(provider_contact_ciphertext)
  rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveSupport::MessageEncryptor::InvalidMessage
    nil
  end

  def consented_to_audio?
    voice_review_consents.where(purpose: 'process_audio', granted: true, revoked_at: nil).exists?
  end

  def draft_data
    has_attribute?(:draft_payload) && draft_payload.is_a?(Hash) ? draft_payload : {}
  end

  def draft_rating
    value = draft_data['initial_rating'].to_i
    value.between?(1, 5) ? value : nil
  end

  def merge_draft!(attrs)
    return unless has_attribute?(:draft_payload)

    update!(draft_payload: draft_data.merge(attrs.stringify_keys))
  end

  def self.digest_token(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  attr_accessor :raw_session_token

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end

  def encryptor
    ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('voice-review-contact', 32))
  end
end
