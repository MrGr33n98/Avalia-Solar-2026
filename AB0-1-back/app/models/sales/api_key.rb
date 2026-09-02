require 'digest'

module Sales
  class ApiKey < ApplicationRecord
    self.table_name = 'sales_api_keys'
    belongs_to :user
    belongs_to :company, optional: true
    scope :active, -> { where(revoked_at: nil) }

    def self.issue!(user:, name:, scopes: [], company: nil)
      raw = "as_#{SecureRandom.hex(24)}"
      key = create!(user: user, company: company, name: name, key_prefix: raw.first(10),
                    key_digest: Digest::SHA256.hexdigest(raw), scopes: scopes)
      [key, raw]
    end

    def self.authenticate(raw)
      active.find_by(key_digest: Digest::SHA256.hexdigest(raw.to_s))
    end
  end
end
