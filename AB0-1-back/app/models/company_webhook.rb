class CompanyWebhook < ApplicationRecord
  belongs_to :company

  validates :url, presence: true, format: URI::DEFAULT_PARSER.make_regexp(%w[http https])
  validates :secret_key, length: { minimum: 32 }, allow_blank: true

  scope :active, -> { where(active: true) }
  scope :for_event, ->(event_name) { where("events @> ?::jsonb", [event_name].to_json) }

  before_create :generate_secret_key

  SUPPORTED_EVENTS = %w[
    intent.hot
    intent.boiling
    intent.immediate
    intent.declared
    lead.captured
    lead.identified
  ].freeze

  def generate_secret_key
    self.secret_key ||= SecureRandom.hex(32)
  end

  def sign_payload(payload_json)
    OpenSSL::HMAC.hexdigest('SHA256', secret_key, payload_json)
  end

  def subscribed_to?(event_name)
    events.include?(event_name)
  end
end
