# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP public directory tools/call', type: :request do
  let(:rsa) { OpenSSL::PKey::RSA.generate(2048) }
  let(:resource) { 'https://www.example.com/mcp' }
  let(:issuer) { 'https://issuer.example.com' }
  let(:redis) { double('Redis') }
  let(:claims) do
    {
      iss: issuer, aud: resource, sub: 'reader-01',
      client_id: 'verified-client',
      exp: (Time.current + 5.minutes).to_i,
      iat: Time.current.to_i, jti: SecureRandom.uuid,
      scope: 'mcp:public:read'
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('oauth')
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(resource)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return(issuer)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_TOOLS_EXECUTION_ENABLED').and_return('true')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
    allow(redis).to receive(:call).and_return(1)
  end

  def call_tool(name, arguments, extra_headers: {})
    token = JWT.encode(claims, rsa, 'RS256', { typ: 'at+jwt', kid: 'test' })
    data = {
      jsonrpc: '2.0', id: 'test-call-01', method: 'tools/call',
      params: {
        name: name, arguments: arguments,
        _meta: {
          'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      }
    }
    headers = {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => 'tools/call',
      'Mcp-Name' => name,
      'Authorization' => "Bearer #{token}"
    }
    post '/mcp', params: data.to_json, headers: headers.merge(extra_headers)
  end

  it 'returns real active company records in protocol-compliant structured content' do
    company = create(:company, status: :active, name: 'Aurora Solar CI')
    call_tool('list_integrators', { 'query' => 'Aurora Solar CI', 'limit' => 5 })
    expect(response).to have_http_status(:ok)
    result = response.parsed_body.fetch('result')
    expect(result['resultType']).to eq('complete')
    expect(result['isError']).to be(false)
    expect(result.dig('structuredContent', 'data', 'integrators').map { |row| row.fetch('id') }).to include(company.id)
    expect(result.fetch('content').first.fetch('type')).to eq('text')
  end

  it 'refuses internal tool names even with valid OAuth and quotas' do
    call_tool('bulk_lead_export', { 'company_id' => 1 })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_602)
  end

  it 'keeps reputation and comparisons blocked until their reviewed release' do
    call_tool('get_integrator_reputation', { 'company_id' => 1 })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
  end

  it 'rejects unknown input fields before querying any domain services' do
    call_tool('list_integrators', { 'query' => 'solar', 'tenant_id' => 999 })
    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_602)
  end

  it 'cannot execute when global execution flag is disabled' do
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_TOOLS_EXECUTION_ENABLED').and_return('false')
    call_tool('list_integrators', { 'query' => 'solar' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
  end

  it 'cannot execute when Redis policy is disabled' do
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return('false')
    call_tool('list_integrators', { 'query' => 'solar' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
  end
end
