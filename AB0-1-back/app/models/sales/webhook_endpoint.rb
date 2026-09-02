require 'digest'

module Sales
  class WebhookEndpoint < ApplicationRecord
    self.table_name = 'sales_webhook_endpoints'
    belongs_to :company, optional: true
    belongs_to :created_by, class_name: 'User', optional: true
    has_many :deliveries, class_name: 'Sales::WebhookDelivery', foreign_key: :endpoint_id, dependent: :destroy
    validates :url, :secret_digest, presence: true

    def self.create_secure!(attributes, secret:)
      create!(attributes.merge(secret_digest: Digest::SHA256.hexdigest(secret.to_s)))
    end
  end
end
