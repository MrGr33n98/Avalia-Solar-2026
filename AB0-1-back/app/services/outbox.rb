# frozen_string_literal: true

module Outbox
  def self.record!(event_type:, aggregate:, payload: {}, company_id: nil, event_version: 1, metadata: {}, correlation_id: nil, causation_id: nil, occurred_at: Time.current)
    Outbox::Record.call(
      event_type: event_type,
      aggregate: aggregate,
      payload: payload,
      company_id: company_id,
      event_version: event_version,
      metadata: metadata,
      correlation_id: correlation_id,
      causation_id: causation_id,
      occurred_at: occurred_at
    )
  end

  def self.dispatch!(batch_size: 100)
    Outbox::DispatcherService.call(batch_size: batch_size)
  end
end
