class VoiceReviewInvite < ApplicationRecord
  self.primary_key = 'id'

  belongs_to :company
  belongs_to :review_form
  belongs_to :issued_by_user, class_name: 'User', optional: true
  has_many :voice_review_sessions, dependent: :restrict_with_exception

  enum kind: { personal: 'personal', reusable_qr: 'reusable_qr' }
  enum status: { active: 'active', revoked: 'revoked', expired: 'expired' }

  validates :code_digest, :idempotency_key, presence: true
  validate :review_form_belongs_to_company

  before_validation :ensure_id

  def active_now?
    return false if source == 'brand_page' && (!company.voice_review_cta_enabled? || !company.active_status?)

    active? && review_form.active? && (expires_at.blank? || expires_at.future?)
  end

  def public_url
    "#{VoiceReviews::Config.frontend_origin}/v/#{public_code}"
  end

  def whatsapp_url
    number = VoiceReviews::Config.whatsapp_number
    return nil if number.blank?

    "https://wa.me/#{number}?text=#{CGI.escape("AVS #{public_code}")}"
  end

  def public_code
    @public_code ||= decrypt_code
  end

  def public_code=(value)
    @public_code = value
  end

  def claimable?
    active_now? && (max_claims.blank? || claims_count < max_claims)
  end

  private

  def ensure_id
    self.id ||= SecureRandom.uuid
  end

  def review_form_belongs_to_company
    return if review_form.blank? || company.blank? || review_form.company_id == company_id

    errors.add(:review_form, 'deve pertencer à empresa do convite')
  end

  def decrypt_code
    encryptor = ActiveSupport::MessageEncryptor.new(Rails.application.key_generator.generate_key('voice-review-code', 32))
    encryptor.decrypt_and_verify(code_ciphertext)
  rescue ActiveSupport::MessageVerifier::InvalidSignature, ActiveSupport::MessageEncryptor::InvalidMessage
    nil
  end
end
