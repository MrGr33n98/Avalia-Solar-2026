require 'bcrypt'

require 'bcrypt'
class Lead < ApplicationRecord
  # Make company association optional since the database might not have company_id column
  belongs_to :company, optional: true
  has_many :lead_distributions, dependent: :destroy
  has_many :distributed_companies, through: :lead_distributions, source: :company

  enum wizard_status: {
    draft: 'draft',
    pending_otp: 'pending_otp',
    verified: 'verified',
    distributed: 'distributed',
    proposal_submitted: 'proposal_submitted',
    proposal_processing: 'proposal_processing',
    proposal_sent: 'proposal_sent',
    proposal_failed: 'proposal_failed'
  }, _suffix: true

  SIMPLE_EMAIL_REGEX = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/
  OTP_TTL = 10.minutes
  OTP_MAX_ATTEMPTS = 5
  OTP_RESEND_COOLDOWN = 60.seconds
  PROPOSAL_STATUSES = %w[
    proposal_submitted
    proposal_processing
    proposal_sent
    proposal_failed
  ].freeze

  before_validation :normalize_contact_fields
  before_validation :apply_address_fallbacks
  before_validation :ensure_otp_attempts_default

  after_commit :track_analytics_event, on: :create

  validates :product_vertical, :project_profile, :quote_type, :system_size_band,
            :decision_timeline, :address_full,
            presence: true,
            if: :wizard_validation_required?
  validates :name, :email, :phone, presence: true, if: :wizard_validation_required?
  validates :email,
            format: { with: SIMPLE_EMAIL_REGEX, message: 'must be a valid email' },
            if: :wizard_validation_required?
  validates :consent_at, presence: true, if: :wizard_validation_required?
  validates :name, :email, :phone, presence: true, if: :proposal_validation_required?
  validates :email,
            format: { with: SIMPLE_EMAIL_REGEX, message: 'must be a valid email' },
            if: :proposal_validation_required?

  # Add these methods for Ransack
  def self.ransackable_attributes(_auth_object = nil)
    %w[
      address_full bill_value city company company_id consent_at consent_ip created_at
      decision_timeline email estimated_budget id location message monthly_kwh
      name otp_attempts otp_sent_at otp_verified_at phone product_vertical
      project_profile project_type quote_type state system_size_band updated_at
      wizard_status zipcode
    ]
  end

  def self.ransackable_associations(_auth_object = nil)
    ["company", "lead_distributions"]
  end

  def wizard_validation_required?
    wizard_status.present? && wizard_status != 'draft' && !proposal_status?
  end

  def proposal_validation_required?
    proposal_status?
  end

  def proposal_status?
    PROPOSAL_STATUSES.include?(wizard_status)
  end

  def otp_expired?
    otp_sent_at.blank? || otp_sent_at < OTP_TTL.ago
  end

  def otp_attempts_exceeded?
    otp_attempts.to_i >= OTP_MAX_ATTEMPTS
  end

  def otp_can_resend?
    otp_sent_at.blank? || otp_sent_at < OTP_RESEND_COOLDOWN.ago
  end

  def generate_otp!
    code = self.class.generate_otp_code
    update!(
      otp_code_digest: BCrypt::Password.create(code),
      otp_sent_at: Time.current,
      otp_attempts: 0
    )
    code
  end

  def valid_otp?(code)
    return false if otp_code_digest.blank?
    BCrypt::Password.new(otp_code_digest).is_password?(code.to_s)
  end

  def increment_otp_attempts!
    update!(otp_attempts: otp_attempts.to_i + 1)
  end

  def self.generate_otp_code
    SecureRandom.random_number(1_000_000).to_s.rjust(6, '0')
  end

  def self.extract_address_parts(address)
    return {} if address.blank?

    parts = {}
    zip = address.match(/\b\d{5}-?\d{3}\b/)
    parts[:zipcode] = zip[0] if zip

    city_state = address.match(/[-,]\s*([A-Za-z\s]+)\s*-\s*([A-Za-z]{2})\b/)
    if city_state
      parts[:city] = city_state[1].strip
      parts[:state] = city_state[2].strip.upcase
    else
      state = address.match(/\b([A-Za-z]{2})\b$/)
      parts[:state] = state[1].upcase if state
    end

    parts
  end

  private

  def normalize_contact_fields
    self.name = name.to_s.strip if name.present?
    self.email = email.to_s.strip.downcase if email.present?
    self.phone = phone.to_s.gsub(/\D/, '') if phone.present?
    self.address_full = address_full.to_s.strip if address_full.present?
  end

  def apply_address_fallbacks
    return if address_full.blank?

    self.location = address_full if location.blank?
    return if city.present? && state.present? && zipcode.present?

    extracted = self.class.extract_address_parts(address_full)
    self.city ||= extracted[:city]
    self.state ||= extracted[:state]
    self.zipcode ||= extracted[:zipcode]
  end

  def ensure_otp_attempts_default
    self.otp_attempts = 0 if otp_attempts.nil?
  end

  def track_analytics_event
    return if company_id.blank?

    Analytics::TrackEventService.call(
      company_id: company_id,
      event_type: 'lead_created',
      metadata: {
        source: 'lead',
        estimated_budget: estimated_budget,
        project_type: project_type
      }.compact,
      user: nil,
      tracked_at: created_at
    )
  rescue StandardError => e
    Rails.logger.warn("[Analytics] lead tracking failed: #{e.message}")
  end
end
