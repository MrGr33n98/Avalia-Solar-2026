# frozen_string_literal: true

module Chat
  class CRMWebhookDispatchJob < ApplicationJob
    class TransientDeliveryError < StandardError; end
    class PermanentDeliveryError < StandardError; end

    queue_as :default
    retry_on Net::OpenTimeout, Net::ReadTimeout, Faraday::TimeoutError,
             wait: :polynomially_longer, attempts: 5
    retry_on TransientDeliveryError, wait: :polynomially_longer, attempts: 5
    discard_on PermanentDeliveryError

    IDEMPOTENCY_WINDOW = 5.minutes

    def perform(chat_lead_id, event_name = 'lead.captured')
      lead = ChatLead.find(chat_lead_id)
      return unless lead.assigned_company_id.present?

      payload = payload_for(lead)
      CompanyWebhook.active.for_event(event_name).where(company_id: lead.assigned_company_id).find_each do |webhook|
        deliver_once(webhook, event_name, payload, chat_lead_id)
      end
    end

    private

    def deliver_once(webhook, event_name, payload, lead_id)
      event_id = "chat-lead:#{lead_id}:#{event_name}:#{webhook.id}"
      lock_key = "crm_webhook_dispatch:#{Digest::SHA256.hexdigest(event_id)}"
      acquired = Rails.cache.write(lock_key, true, expires_in: IDEMPOTENCY_WINDOW, unless_exist: true)
      return unless acquired

      payload_json = { id: event_id, event: event_name, timestamp: Time.current.iso8601, data: payload }.to_json
      response = Faraday.post(webhook.url) do |request|
        request.headers['Content-Type'] = 'application/json'
        request.headers['X-Webhook-Signature'] = webhook.sign_payload(payload_json)
        request.headers['X-Webhook-Event'] = event_name
        request.headers['Idempotency-Key'] = event_id
        request.body = payload_json
        request.options.timeout = 5
        request.options.open_timeout = 5
      end

      if response.status >= 500
        raise TransientDeliveryError, "CRM webhook delivery failed: HTTP #{response.status}"
      end
      if response.status >= 400
        raise PermanentDeliveryError, "CRM webhook rejected: HTTP #{response.status}"
      end

      Rails.logger.info({ event: 'crm_webhook.delivered', event_id: event_id, status: response.status }.to_json)
    rescue StandardError
      Rails.cache.delete(lock_key) if lock_key
      raise
    end

    def payload_for(lead)
      {
        lead_id: lead.id,
        company_id: lead.assigned_company_id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        city: lead.city,
        state: lead.state,
        vertical: lead.vertical,
        intent: lead.intent,
        lead_score: lead.lead_score,
        lead_temperature: lead.lead_temperature,
        monthly_bill: lead.monthly_bill,
        source_page: lead.source_page,
        consent_given: lead.consent_given
      }
    end
  end
end
