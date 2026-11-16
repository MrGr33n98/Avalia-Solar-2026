# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP 2026-07-28 stateless transport preview', type: :request do
  let(:preview_key) { 'mcp-modern-preview-example-key-at-least-thirty-two-bytes' }
  let(:metadata) do
    {
      'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
      'io.modelcontextprotocol/clientInfo' => { name: 'rspec-mcp', version: '1' },
      'io.modelcontextprotocol/clientCapabilities' => {}
    }
  end
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => 'server/discover',
      'X-MCP-Preview-Key' => preview_key
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_PREVIEW_TOKEN').and_return(preview_key)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
  end

  def modern(method, id: 1, params: {}, extra_headers: {})
    payload = { jsonrpc: '2.0', id: id, method: method, params: { _meta: metadata }.merge(params) }
    post '/mcp', params: payload.to_json, headers: headers.merge('Mcp-Method' => method).merge(extra_headers)
  end

  it 'discovers modern capabilities without initialize and never issues a session' do
    modern('server/discover', id: 'discovery')
    expect(response).to have_http_status(:ok)
    body = response.parsed_body
    expect(body).to include('jsonrpc' => '2.0', 'id' => 'discovery')
    expect(body.dig('result', 'resultType')).to eq('complete')
    expect(body.dig('result', 'supportedVersions')).to include('2026-07-28')
    expect(body.dig('result', 'capabilities')).to eq('tools' => {})
    expect(body.dig('result', '_meta', 'io.modelcontextprotocol/serverInfo', 'name')).to eq('avalia-solar-mcp-preview')
    expect(body.dig('result', 'ttlMs')).to eq(0)
    expect(body.dig('result', 'cacheScope')).to eq('private')
    expect(response.headers['MCP-Session-Id']).to be_nil
  end

  it 'returns only the public tool catalog with modern cache metadata' do
    modern('tools/list', id: 11)
    expect(response).to have_http_status(:ok)
    result = response.parsed_body.fetch('result')
    expect(result['resultType']).to eq('complete')
    expect(result['ttlMs']).to eq(0)
    expect(result['cacheScope']).to eq('private')
    expect(result.fetch('tools').map { |tool| tool.fetch('name') }).to eq(Mcp::PublicToolRegistry.names)
    expect(response.body).not_to include('bulk_lead_export', 'send_outbound_campaign', 'revenue_search_accounts')
  end

  it 'never executes a public or private tool and requires matching Mcp-Name' do
    modern('tools/call', params: { name: 'list_integrators', arguments: {} },
           extra_headers: { 'Mcp-Name' => 'list_integrators' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)

    modern('tools/call', params: { name: 'bulk_lead_export', arguments: {} },
           extra_headers: { 'Mcp-Name' => 'bulk_lead_export' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)

    modern('tools/call', params: { name: 'list_integrators', arguments: {} },
           extra_headers: { 'Mcp-Name' => 'bulk_lead_export' })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_020)
  end

  it 'accepts correctly encoded Base64 Mcp-Name headers without ever invoking a tool' do
    modern('tools/call', params: { name: 'list_integrators', arguments: {} },
           extra_headers: { 'Mcp-Name' => '=?base64?bGlzdF9pbnRlZ3JhdG9ycw==?=' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)

    modern('tools/call', params: { name: 'list_integrators', arguments: {} },
           extra_headers: { 'Mcp-Name' => '=?base64?%%%?=' })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_020)
  end

  it 'rejects a spoofed Mcp-Method header' do
    modern('server/discover', extra_headers: { 'Mcp-Method' => 'tools/call' })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_020)
  end

  it 'rejects a mismatched body protocol version and missing header' do
    modern('server/discover', params: { _meta: metadata.merge('io.modelcontextprotocol/protocolVersion' => '2025-11-25') })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_020)

    modern('server/discover', extra_headers: { 'MCP-Protocol-Version' => '' })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_020)
  end

  it 'returns supported protocol versions for unknown modern versions' do
    modern('server/discover',
           params: { _meta: metadata.merge('io.modelcontextprotocol/protocolVersion' => '2099-01-01') },
           extra_headers: { 'MCP-Protocol-Version' => '2099-01-01' })
    expect(response).to have_http_status(:bad_request)
    err = response.parsed_body.fetch('error')
    expect(err.fetch('code')).to eq(-32_022)
    expect(err.dig('data', 'supported')).to include('2026-07-28', '2025-11-25')
  end

  it 'requires per-request client capabilities and metadata' do
    modern('server/discover', params: { _meta: metadata.except('io.modelcontextprotocol/clientCapabilities') })
    expect(response).to have_http_status(:bad_request)

    modern('server/discover', params: { _meta: 'not-an-object' })
    expect(response).to have_http_status(:bad_request)
  end

  it 'rejects unknown methods with HTTP 404 and JSON-RPC method not found' do
    modern('unknown/method')
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_601)
  end

  it 'remains hidden without correct preview key' do
    modern('server/discover', extra_headers: { 'X-MCP-Preview-Key' => 'invalid' })
    expect(response).to have_http_status(:not_found)
  end

  it 'preserves the legacy 2025-11-25 handshake alongside the modern path' do
    body = {
      jsonrpc: '2.0', id: 12, method: 'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } }
    }
    post '/mcp', params: body.to_json,
         headers: headers.merge('MCP-Protocol-Version' => '2025-11-25').except('Mcp-Method')
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'protocolVersion')).to eq('2025-11-25')
  end
end
