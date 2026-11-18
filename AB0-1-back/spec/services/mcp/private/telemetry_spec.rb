# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::Private::Telemetry do
  it 'emits bounded private labels with no tenant, PII, token or arguments' do
    captured = []
    subscription = ActiveSupport::Notifications.subscribe(described_class::EVENT_NAME) do |_name, _start, _finish, _id, payload|
      captured << payload
    end

    result = described_class.record(
      operation: 'tools/call',
      tool_name: 'get_my_company_overview',
      status: 200,
      duration_ms: 27,
      request_id: 'request-123'
    )

    expect(captured).to eq([result])
    expect(result).to include(
      surface: 'private', operation: 'tools/call',
      tool: 'get_my_company_overview', outcome: 'completed',
      http_status: 200, duration_ms: 27
    )
    expect(result.keys).to match_array(
      %i[surface operation tool outcome http_status duration_ms request_id]
    )
    expect(JSON.generate(result)).not_to include(
      'Bearer', 'Authorization', 'tenant_id', 'company_id', 'email', '192.0.2.'
    )
  ensure
    ActiveSupport::Notifications.unsubscribe(subscription) if subscription
  end

  it 'rejects unbounded dimensions, request identifiers and unknown tools' do
    result = described_class.record(
      operation: 'tools/export_secrets',
      tool_name: 'bulk_lead_export',
      status: 403,
      duration_ms: -200,
      request_id: '<script>inject!</script>'
    )

    expect(result).to include(
      surface: 'private', operation: 'unknown',
      tool: 'unknown', outcome: 'rejected', duration_ms: 0
    )
    expect(result).not_to have_key(:request_id)
  end

  it 'marks quota service outages as errors' do
    result = described_class.record(
      operation: 'tools/list', tool_name: nil,
      status: 503, duration_ms: 312, request_id: 'req-503'
    )
    expect(result).to include(outcome: 'error', http_status: 503)
  end
end
