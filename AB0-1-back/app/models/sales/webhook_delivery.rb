module Sales
  class WebhookDelivery < ApplicationRecord
    self.table_name = 'sales_webhook_deliveries'
    belongs_to :endpoint, class_name: 'Sales::WebhookEndpoint'
    validates :event_type, :idempotency_key, presence: true
  end
end
