module ReviewForms
  class EventRecorder
    def self.call(review_form:, event_type:, source:, metadata: {}, request_context: nil)
      metadata = metadata.deep_stringify_keys.merge('schema_version' => 1)
      review_form.review_form_events.create!(
        company: review_form.company,
        event_type: event_type,
        source: source.presence || 'link',
        ip_hash: request_context&.ip_hash,
        referrer: request_context&.referrer.to_s.first(500),
        user_agent: request_context&.user_agent.to_s.first(500),
        metadata: metadata
      )
    end
  end
end
