# frozen_string_literal: true

module Chat
  module RetentionPolicy
    RETENTION = {
      chat_session: 90.days,
      chat_message: 90.days,
      chat_lead: 730.days,
      attachments: 30.days,
      analytics: 730.days
    }.freeze

    PII_FIELDS = %w[name phone email city ip_address user_agent attachments].freeze

    def self.expired?(kind, created_at:, now: Time.current)
      ttl = RETENTION.fetch(kind.to_sym)
      created_at < now - ttl
    end

    def self.anonymize_lead!(lead)
      lead.update!(name: nil, phone: nil, email: nil, city: nil, state: nil, metadata: {})
    end
  end
end
