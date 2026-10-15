# frozen_string_literal: true

require 'digest'

class OutboundClick < ApplicationRecord
  self.table_name = 'outbound_clicks'

  ALLOWED_SOURCES = %w[profile compare calculator directory search quote_modal ad_rail banner other].freeze
  ALLOWED_DESTINATION_TYPES = %w[website cta_primary cta_secondary custom].freeze

  belongs_to :company
  belongs_to :anonymous_session, optional: true

  validates :company_id, presence: true
  validates :source_context, presence: true, inclusion: { in: ALLOWED_SOURCES }
  validates :destination_type, presence: true, inclusion: { in: ALLOWED_DESTINATION_TYPES }
  validates :target_url, presence: true, length: { maximum: 2048 }
  validates :click_token_signature, presence: true, length: { maximum: 128 }
  validates :clicked_at, presence: true
  validates :idempotency_key, uniqueness: true, allow_nil: true, length: { maximum: 128 }

  scope :recent, -> { order(clicked_at: :desc) }
  scope :by_company, ->(cid) { where(company_id: cid) }
  scope :by_source, ->(src) { where(source_context: src) }

  def self.anonymize_ip(ip)
    return nil if ip.blank?

    salt = Rails.application.secret_key_base
    Digest::SHA256.hexdigest("#{ip}#{salt}")[0..63]
  end

  def self.hash_user_agent(user_agent)
    return nil if user_agent.blank?

    Digest::SHA256.hexdigest(user_agent.to_s)[0..63]
  end
end
