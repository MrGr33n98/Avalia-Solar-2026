module Sales
  class WebhookDispatcher
    def self.call(event_type:, payload:, company_id: nil)
      WebhookEndpoint.where(company_id: company_id, active: true).each do |endpoint|
        next unless endpoint.events.blank? || endpoint.events.include?(event_type)

        delivery = endpoint.deliveries.create!(event_type: event_type,
                                               idempotency_key: "#{event_type}:#{SecureRandom.uuid}")
        DeliverWebhookJob.perform_later(delivery.id, payload)
      end
    end
  end
end
