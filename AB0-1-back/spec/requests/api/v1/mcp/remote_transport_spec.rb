# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP remote transport preview', type: :request do
  let(:preview_key) { 'mcp-preview-test-token-with-at-least-32-bytes-long' }
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25',
      'X-MCP-Preview-Key' => preview_key
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PREVIEW_TOKEN').and_return(preview_key)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
  end

  def request_mcp(method:, id: 1, params: {}, extra_headers: {})
    post '/mcp',
         params: { jsonrpc: '2.0', id: id, method: method, params: params }.to_json,
         headers: headers.merge(extra_headers)
  end

  it 'is unreachable when the feature switch is disabled' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('false')

    request_mcp(method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } })
    expect(response).to have_http_status(:not_found)
  end

  it 'is unreachable when the preview secret is not configured' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PREVIEW_TOKEN').and_return(nil)

    request_mcp(method: 'ping')
    expect(response).to have_http_status(:not_found)
  end

  it 'is unreachable when the preview key is missing or incorrect' do
    request_mcp(method: 'ping', extra_headers: { 'X-MCP-Preview-Key' => 'invalid-key' })
    expect(response).to have_http_status(:not_found)
  end

  it 'blocks a non-allowlisted Host even without an Origin header' do
    request_mcp(method: 'ping', extra_headers: { 'HOST' => 'untrusted.example' })
    expect(response).to have_http_status(:forbidden)
  end

  it 'blocks an untrusted origin even with the correct preview key' do
    request_mcp(method: 'ping', extra_headers: { 'Origin' => 'https://malicious.example' })
    expect(response).to have_http_status(:forbidden)
  end

  it 'accepts an explicitly allowlisted origin' do
    request_mcp(method: 'ping', extra_headers: { 'Origin' => 'https://trusted.example' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result')).to eq({})
  end

  it 'negotiates the 2025-11-25 initialization handshake without sessions' do
    request_mcp(method: 'initialize',
                params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'mcp-client', version: '1.0' } })

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include('jsonrpc' => '2.0', 'id' => 1)
    expect(response.parsed_body.dig('result', 'protocolVersion')).to eq('2025-11-25')
    expect(response.parsed_body.dig('result', 'capabilities', 'tools')).to eq({})
    expect(response.headers['MCP-Session-Id']).to be_nil
  end

  it 'returns 202 with an empty body for initialization notifications' do
    post '/mcp',
         params: { jsonrpc: '2.0', method: 'notifications/initialized' }.to_json,
         headers: headers

    expect(response).to have_http_status(:accepted)
    expect(response.body).to be_blank
  end

  it 'requires version headers for post-initialize notifications' do
    post '/mcp',
         params: { jsonrpc: '2.0', method: 'notifications/initialized' }.to_json,
         headers: headers.merge('MCP-Protocol-Version' => '')

    expect(response).to have_http_status(:bad_request)
  end

  it 'supports JSON-RPC ping' do
    request_mcp(method: 'ping', id: 'ping-001')
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq('jsonrpc' => '2.0', 'id' => 'ping-001', 'result' => {})
  end

  it 'advertises exactly five public read-only tools without internal sources' do
    request_mcp(method: 'tools/list')
    expect(response).to have_http_status(:ok)

    tools = response.parsed_body.dig('result', 'tools')
    expect(tools.map { |tool| tool.fetch('name') }).to eq(Mcp::PublicToolRegistry.names)
    expect(tools.length).to eq(5)
    expect(tools).to all(satisfy { |tool| tool.dig('annotations', 'readOnlyHint') == true })
    expect(response.body).not_to include('bulk_lead_export', 'send_outbound_campaign', 'revenue_search_accounts', 'approval_execute')
  end

  it 'refuses all tools/call requests, even for public tools and privileged-looking names' do
    %w[list_integrators bulk_lead_export revenue_request_campaign_send].each do |tool_name|
      request_mcp(method: 'tools/call', params: { name: tool_name, arguments: {} })
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
      expect(response.body).not_to include('tenant_id', 'access_token', 'backtrace')
    end
  end

  it 'rejects unsupported protocol revisions and missing version headers' do
    request_mcp(method: 'tools/list', extra_headers: { 'MCP-Protocol-Version' => '2099-01-01' })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_602)

    request_mcp(method: 'tools/list', extra_headers: { 'MCP-Protocol-Version' => '' })
    expect(response).to have_http_status(:bad_request)
  end

  it 'rejects incompatible content negotiation' do
    request_mcp(method: 'ping', extra_headers: { 'ACCEPT' => 'application/json' })
    expect(response).to have_http_status(:not_acceptable)

    request_mcp(method: 'ping', extra_headers: { 'CONTENT_TYPE' => 'text/plain' })
    expect(response).to have_http_status(:unsupported_media_type)
  end

  it 'rejects malformed request shape and arrays instead of JSON-RPC objects' do
    post '/mcp', params: [].to_json, headers: headers
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_600)

    post '/mcp', params: { jsonrpc: '2.0', method: 'ping', id: true }.to_json, headers: headers
    expect(response).to have_http_status(:bad_request)
  end

  it 'rejects oversized requests without executing tools' do
    post '/mcp', params: { data: 'x' * 33_000 }.to_json, headers: headers
    expect(response).to have_http_status(:payload_too_large)
  end

  it 'does not open GET event streams or DELETE session management' do
    get '/mcp', headers: headers
    expect(response).to have_http_status(:method_not_allowed)
    expect(response.headers['Allow']).to eq('POST')

    delete '/mcp', headers: headers
    expect(response).to have_http_status(:method_not_allowed)
  end

  it 'returns a safe protocol-level method-not-found error' do
    request_mcp(method: 'dangerous/method')
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error')).to eq('code' => -32_601, 'message' => 'Method not found.')
  end
end
