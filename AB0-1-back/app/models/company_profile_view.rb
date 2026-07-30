# frozen_string_literal: true

class CompanyProfileView < ApplicationRecord
  belongs_to :company

  BOT_PATTERNS = /\b(bot|crawl|spider|slurp|mediapartners|googlebot|bingbot|yandex|baidu|duckduck|semrush|ahrefs|mj12|rogerbot)\b/i.freeze
  MAX_FINGERPRINT_LENGTH = 64
  MAX_IP_HASH_LENGTH = 64

  validates :session_fingerprint, presence: true, length: { maximum: MAX_FINGERPRINT_LENGTH }
  validates :ip_hash,             presence: true, length: { maximum: MAX_IP_HASH_LENGTH }
  validates :viewed_at,           presence: true

  scope :recent_24h,  -> { where('viewed_at >= ?', 24.hours.ago) }
  scope :for_company, ->(company_id) { where(company_id: company_id) }

  def self.bot_user_agent?(user_agent)
    return true if user_agent.blank?

    BOT_PATTERNS.match?(user_agent)
  end

  def self.hash_value(value)
    return nil if value.blank?

    Digest::SHA256.hexdigest(value.to_s)[0, MAX_IP_HASH_LENGTH]
  end
end
