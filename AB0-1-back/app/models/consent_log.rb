# frozen_string_literal: true

class ConsentLog < ApplicationRecord
  belongs_to :user, optional: true
  
  # Validations
  validates :session_id, presence: true
  validates :consent_type, presence: true, inclusion: { 
    in: %w[analytics marketing functional all none] 
  }
  validates :consent_given, inclusion: { in: [true, false] }
  validates :consent_method, presence: true, inclusion: { 
    in: %w[banner settings api default] 
  }
  validates :policy_version, presence: true
  validates :consented_at, presence: true
  
  # Scopes
  scope :recent, -> { order(consented_at: :desc) }
  scope :for_user, ->(user_id) { where(user_id: user_id) }
  scope :for_session, ->(session_id) { where(session_id: session_id) }
  scope :by_policy_version, ->(version) { where(policy_version: version) }
  scope :expired, -> { where('expires_at < ?', Time.current) }
  scope :active, -> { where('expires_at IS NULL OR expires_at > ?', Time.current) }
  
  # Current consent status for a user or session
  def self.current_consent(user_id: nil, session_id: nil)
    scope = recent.active
    scope = scope.for_user(user_id) if user_id.present?
    scope = scope.for_session(session_id) if session_id.present?
    scope.first
  end
  
  # Audit trail export for compliance
  def self.export_for_audit(user_id: nil, session_id: nil)
    scope = recent
    scope = scope.for_user(user_id) if user_id.present?
    scope = scope.for_session(session_id) if session_id.present?
    scope.select(:id, :user_id, :session_id, :consent_type, :consent_given, :consented_at, :consent_method, :policy_version, :ip_address)
  end
  
  # Check if user has given consent for specific type
  def self.has_consent?(type:, user_id: nil, session_id: nil)
    consent = current_consent(user_id: user_id, session_id: session_id)
    return false unless consent&.consent_given
    
    case type.to_s
    when 'analytics', 'marketing', 'functional'
      consent.consent_type == type.to_s || consent.consent_type == 'all'
    else
      false
    end
  end
end
