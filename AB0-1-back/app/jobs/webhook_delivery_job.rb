class WebhookDeliveryJob < ApplicationJob
  queue_as :default
  retry_on Net::OpenTimeout, Net::ReadTimeout, wait: 5.seconds, attempts: 3

  def perform(webhook_id, event_name, payload)
    webhook = CompanyWebhook.find(webhook_id)

    return unless webhook.active? && webhook.subscribed_to?(event_name)

    payload_json = {
      event: event_name,
      timestamp: Time.current.iso8601,
      data: payload
    }.to_json

    signature = webhook.sign_payload(payload_json)

    response = Faraday.post(webhook.url) do |req|
      req.headers['Content-Type'] = 'application/json'
      req.headers['X-Webhook-Signature'] = signature
      req.headers['X-Webhook-Event'] = event_name
      req.body = payload_json
      req.options.timeout = 10
      req.options.open_timeout = 5
    end

    if response.status >= 400
      Rails.logger.error("[Webhook] Failed delivery to #{webhook.url}: #{response.status}")
      raise "Webhook delivery failed: HTTP #{response.status}"
    end

    Rails.logger.info("[Webhook] ✓ Delivered #{event_name} to #{webhook.url}")
  rescue StandardError => e
    Rails.logger.error("[Webhook] Error: #{e.message}")
    raise
  end
end
