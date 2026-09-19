# frozen_string_literal: true

require 'digest'
require 'securerandom'

class McpAgentCredential < ApplicationRecord
  STATUSES = %w[active revoked expired].freeze

  validates :agent_identity_id, presence: true
  validates :key_id, presence: true, uniqueness: true
  validates :secret_digest, presence: true
  validates :status, presence: true, inclusion: { in: STATUSES }

  scope :active, -> { where(status: 'active').where('expires_at IS NULL OR expires_at > ?', Time.current) }
  scope :for_agent, ->(agent_id) { where(agent_identity_id: agent_id.to_s) }

  # Gera nova credencial com par de chaves seguro (key_id, raw_secret)
  # Retorna [credential_instance, raw_secret] - o segredo só é conhecido no momento da geração
  def self.generate_for_agent!(agent_id:, expires_in: 90.days, metadata: {})
    raw_secret = "mcp_sk_#{SecureRandom.hex(24)}"
    key_id = "mcp_ak_#{SecureRandom.hex(12)}"
    secret_digest = compute_secret_digest(key_id, raw_secret)

    record = create!(
      agent_identity_id: agent_id.to_s,
      key_id: key_id,
      secret_digest: secret_digest,
      status: 'active',
      expires_at: expires_in ? Time.current + expires_in : nil,
      metadata: metadata || {}
    )

    [record, raw_secret]
  end

  # Autentica e localiza a credencial ativa para um determinado par key_id + raw_secret
  def self.authenticate(key_id:, raw_secret:)
    return nil if key_id.blank? || raw_secret.blank?

    credential = find_by(key_id: key_id.to_s)
    return nil unless credential&.active?

    expected_digest = compute_secret_digest(credential.key_id, raw_secret)
    return nil unless ActiveSupport::SecurityUtils.secure_compare(credential.secret_digest, expected_digest)

    credential.record_usage!
    credential
  end

  def self.compute_secret_digest(key_id, raw_secret)
    salt = Rails.application.secret_key_base || 'mcp_salt_fallback'
    OpenSSL::HMAC.hexdigest('SHA256', salt, "#{key_id}:#{raw_secret}")
  end

  def active?
    status == 'active' && !expired?
  end

  def revoked?
    status == 'revoked'
  end

  def expired?
    status == 'expired' || (expires_at.present? && expires_at <= Time.current)
  end

  def revoke!(reason: nil)
    update!(
      status: 'revoked',
      revoked_at: Time.current,
      metadata: metadata.merge(revocation_reason: reason.presence || 'Revogado administrativamente.')
    )
  end

  def record_usage!
    touch(:last_used_at)
  end

  def agent_identity
    AgentIdentity.find(agent_identity_id)
  end

  # Redaction estrito de segurança
  def as_json(_options = {})
    {
      id: id,
      agent_identity_id: agent_identity_id,
      key_id: key_id,
      status: status,
      created_at: created_at&.iso8601,
      expires_at: expires_at&.iso8601,
      last_used_at: last_used_at&.iso8601,
      revoked_at: revoked_at&.iso8601
    }
  end
end
