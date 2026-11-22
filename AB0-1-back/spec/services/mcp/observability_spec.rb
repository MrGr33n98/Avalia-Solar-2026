# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP Observability and Metrics' do
  it 'configures Yabeda group :mcp with required metrics' do
    expect(defined?(Yabeda)).to be_truthy
    expect(Yabeda.respond_to?(:mcp)).to be(true)
    expect(Yabeda.mcp.respond_to?(:requests_total)).to be(true)
    expect(Yabeda.mcp.respond_to?(:request_duration_seconds)).to be(true)
    expect(Yabeda.mcp.respond_to?(:security_events_total)).to be(true)
    expect(Yabeda.mcp.respond_to?(:quota_events_total)).to be(true)
  end

  it 'records remote telemetry events to Yabeda metrics without PII' do
    expect(Yabeda.mcp.requests_total).to receive(:increment).with({
      surface: 'remote',
      operation: 'tools/list',
      tool: 'list_integrators',
      status: '200',
      outcome: 'completed'
    })
    expect(Yabeda.mcp.request_duration_seconds).to receive(:measure).with({
      surface: 'remote',
      operation: 'tools/list',
      tool: 'list_integrators',
      status: '200'
    }, 0.045)

    Mcp::RemoteTelemetry.record(
      operation: 'tools/list',
      tool_name: 'list_integrators',
      status: 200,
      duration_ms: 45
    )
  end

  it 'records private telemetry events to Yabeda metrics' do
    expect(Yabeda.mcp.requests_total).to receive(:increment).with({
      surface: 'private',
      operation: 'tools/call',
      tool: 'get_my_company_overview',
      status: '200',
      outcome: 'completed'
    })
    expect(Yabeda.mcp.request_duration_seconds).to receive(:measure).with({
      surface: 'private',
      operation: 'tools/call',
      tool: 'get_my_company_overview',
      status: '200'
    }, 0.082)

    Mcp::Private::Telemetry.record(
      operation: 'tools/call',
      tool_name: 'get_my_company_overview',
      status: 200,
      duration_ms: 82
    )
  end

  it 'records security events to Yabeda metrics' do
    expect(Yabeda.mcp.security_events_total).to receive(:increment).with({
      surface: 'remote',
      event_type: 'canary_guard',
      reason: 'forbidden'
    })

    ActiveSupport::Notifications.instrument(
      'mcp.security.event',
      surface: 'remote',
      event_type: 'canary_guard',
      reason: 'forbidden'
    )
  end

  it 'records quota events to Yabeda metrics' do
    expect(Yabeda.mcp.quota_events_total).to receive(:increment).with({
      surface: 'remote',
      mode: 'oauth',
      result: 'rate_limited'
    })

    ActiveSupport::Notifications.instrument(
      'mcp.quota.event',
      surface: 'remote',
      mode: 'oauth',
      result: 'rate_limited'
    )
  end
end
