require 'net/http'

module Sales
  class DeliverWebhookJob < ApplicationJob
    queue_as :default

    def perform(delivery_id, payload)
      delivery = WebhookDelivery.includes(:endpoint).find(delivery_id)
      return if delivery.status == 'delivered' || !delivery.endpoint.active?

      uri = URI.parse(delivery.endpoint.url)
      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request['X-Avalia-Event'] = delivery.event_type
      request['X-Avalia-Delivery'] = delivery.idempotency_key
      request.body = JSON.generate(payload)
      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https', open_timeout: 5, read_timeout: 10) do |http|
        http.request(request)
      end
      attributes = { status: response.is_a?(Net::HTTPSuccess) ? 'delivered' : 'failed', status_code: response.code, response_body: response.body.to_s.first(2000), attempts: delivery.attempts + 1 }; attributes[:delivered_at] = Time.current if response.is_a?(Net::HTTPSuccess); delivery.update!(attributes)
    rescue StandardError => e
      delivery&.update!(status: 'failed', attempts: delivery.attempts + 1, response_body: e.message.first(2000))
      raise
    end
  end
end
