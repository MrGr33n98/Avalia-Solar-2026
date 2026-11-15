# frozen_string_literal: true

class CompanyOnboardingSession < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :company, optional: true
  belongs_to :user, optional: true
  has_many_attached :portfolio_photos

  STATES = %w[opened awaiting_cnpj confirming_data awaiting_email awaiting_segment awaiting_coverage awaiting_brands awaiting_logo awaiting_photos claiming_cnpj claiming_email needs_human_review completed failed expired abandoned].freeze
  enum state: STATES.index_with(&:to_s)

  STEPS = %w[ask_cnpj confirm_data ask_email ask_segment ask_coverage ask_brands ask_logo ask_photos claim_ask_cnpj claim_ask_email finish].freeze

  before_validation :ensure_id

  validates :provider_contact_hash, :provider_contact_ciphertext, :session_token_digest, :expires_at, presence: true
  validates :state, inclusion: { in: STATES }

  scope :active_now, -> { where.not(state: %w[completed failed expired abandoned]).where('expires_at > ?', Time.current) }

  def self.contact_hash(contact)
    clean = contact.to_s.strip
    pepper = defined?(VoiceReviews::Config) ? VoiceReviews::Config.contact_pepper.to_s : ''
    return Digest::SHA256.hexdigest(clean) if pepper.blank?

    OpenSSL::HMAC.hexdigest('SHA256', pepper, clean)
  end

  def self.legacy_contact_hash(contact)
    Digest::SHA256.hexdigest(contact.to_s.strip)
  end

  def self.contact_hashes_for(contact)
    [contact_hash(contact), legacy_contact_hash(contact)].uniq
  end

  def self.find_by_contact(contact)
    return nil if contact.blank?

    active_now.order(created_at: :desc).find_by(provider_contact_hash: contact_hashes_for(contact))
  end

  def self.find_latest_by_contact(contact)
    return nil if contact.blank?

    where(provider_contact_hash: contact_hashes_for(contact)).order(created_at: :desc).first
  end

  def self.digest_token(token)
    Digest::SHA256.hexdigest(token.to_s)
  end

  def active_now?
    !%w[completed failed expired abandoned].include?(state) && expires_at.future?
  end

  def draft_data
    has_attribute?(:draft_payload) && draft_payload.is_a?(Hash) ? draft_payload : {}
  end

  def merge_draft!(attrs)
    return unless has_attribute?(:draft_payload)

    update!(draft_payload: draft_data.merge(attrs.stringify_keys))
  end

  def provider_contact
    encryptor.decrypt_and_verify(provider_contact_ciphertext)
  rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveSupport::MessageEncryptor::InvalidMessage
    nil
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end

  def encryptor
    ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('b2b-onboarding-contact', 32))
  end
end
