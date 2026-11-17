# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::RemoteTelemetry do
  it 'emits a bounded instrumentation event without prompts, tokens, IPs or PII' do
    captured = []
    subscriber = ActiveSupport::Notifications.subscribe(described_class::EVENT_NAME) do |_name, _start, _finish, _id, payload|
      captured << payload
    end

    result = described_class.record(
      operation: 'tools/call', tool_name: 'list_integrators',
      status: 200, duration_ms: 35, request_id: 'req-001'
    )

    expect(captured.length).to eq(1)
    expect(captured.first).to eq(result)
    expect(result).to include(operation: 'tools/call', tool: 'list_integrators',
                              outcome: 'completed', http_status: 200, duration_ms: 35)
    expect(result.keys).to match_array(%i[operation tool outcome http_status duration_ms request_id])
    expect(JSON.generate(result)).not_to include('Authorization', 'Bearer', 'query', 'email', 'tenant_id')
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end

  it 'collapses untrusted label values to unknown and rejects unbounded request IDs' do
    result = described_class.record(
      operation: 'tools/delete_everything', tool_name: 'bulk_lead_export',
      status: 403, duration_ms: -25,
      request_id: '<script>injected-header</script>'
    )
    expect(result).to include(operation: 'unknown', tool: 'unknown',
                              outcome: 'rejected', duration_ms: 0)
    expect(result).not_to have_key(:request_id)
  end

  it 'records HTTP 5xx as error without logging exception messages' do
    result = described_class.record(
      operation: 'server/discover', tool_name: '',
      status: 503, duration_ms: 301, request_id: 'safe-uuid'
    )
    expect(result).to include(outcome: 'error', http_status: 503)
  end
end
