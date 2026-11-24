# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP UI Resources and Tool UI Metadata', type: :request do
  let(:rsa) { OpenSSL::PKey::RSA.generate(2048) }
  let(:resource) { 'https://www.example.com/mcp' }
  let(:issuer) { 'https://issuer.example.com' }
  let(:redis) { double('Redis', call: 1) }
  let(:claims) do
    {
      iss: issuer, aud: resource, sub: 'reader-ui-01',
      client_id: 'verified-client',
      exp: (Time.current + 5.minutes).to_i,
      iat: Time.current.to_i, jti: SecureRandom.uuid,
      scope: 'mcp:public:read'
    }
  end
  let(:token) { JWT.encode(claims, rsa, 'RS256', { typ: 'at+jwt', kid: 'test' }) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('oauth')
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(resource)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return(issuer)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_TOKEN_FORMAT').and_return('jwt')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_POLICY_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_PUBLIC_TOOLS_EXECUTION_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('true')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  def legacy_rpc(method, params: {}, id: 1)
    post '/mcp',
         params: { jsonrpc: '2.0', id: id, method: method, params: params }.to_json,
         headers: {
           'CONTENT_TYPE' => 'application/json',
           'ACCEPT' => 'application/json, text/event-stream',
           'MCP-Protocol-Version' => '2025-11-25',
           'Authorization' => "Bearer #{token}"
         }
  end

  def modern_rpc(method, params: {}, id: 1, name: nil)
    headers = {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => method,
      'Authorization' => "Bearer #{token}"
    }
    headers['Mcp-Name'] = name if name
    meta = {
      'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
      'io.modelcontextprotocol/clientCapabilities' => {}
    }
    post '/mcp',
         params: { jsonrpc: '2.0', id: id, method: method, params: params.merge(_meta: meta) }.to_json,
         headers: headers
  end

  it 'advertises resources capability, lists and reads HTML bundles over legacy 2025-11-25 transport' do
    legacy_rpc(
      'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'chatgpt', version: '1.0' } }
    )
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'capabilities', 'resources')).to eq('listChanged' => false)

    legacy_rpc('resources/list')
    expect(response).to have_http_status(:ok)
    uris = response.parsed_body.dig('result', 'resources').map { |r| r['uri'] }
    expect(uris).to include('ui://avalia-solar/search/v1.html', 'ui://avalia-solar/compare/v1.html')

    legacy_rpc('resources/read', params: { uri: 'ui://avalia-solar/search/v1.html' })
    expect(response).to have_http_status(:ok)
    content = response.parsed_body.dig('result', 'contents', 0)
    expect(content['mimeType']).to eq('text/html;profile=mcp-app')
    expect(content['text']).to include('<!doctype html>').or include('<!DOCTYPE html>')
  end

  it 'attaches _meta.ui.resourceUri and readable Portuguese fallback text on tools/call' do
    company = create(:company, status: :active, name: 'Solar UI Test LTDA', city: 'Florianópolis', state: 'SC')

    legacy_rpc('tools/list')
    list_tool = response.parsed_body.dig('result', 'tools').find { |t| t['name'] == 'list_integrators' }
    expect(list_tool.dig('_meta', 'ui', 'resourceUri')).to eq('ui://avalia-solar/search/v1.html')

    legacy_rpc('tools/call', params: { name: 'list_integrators', arguments: { query: 'Solar UI Test' } })
    expect(response).to have_http_status(:ok)
    result = response.parsed_body.fetch('result')
    expect(result.dig('_meta', 'ui', 'resourceUri')).to eq('ui://avalia-solar/search/v1.html')
    expect(result.dig('structuredContent', 'data', 'integrators').first['id']).to eq(company.id)
    expect(result.dig('content', 0, 'text')).to include('Solar UI Test LTDA')
  end

  it 'supports resources/list and resources/read on modern 2026-07-28 transport' do
    modern_rpc('resources/list')
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'resources').length).to eq(5)

    modern_rpc('resources/read', params: { uri: 'ui://avalia-solar/categories/v1.html' })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'contents', 0, 'uri')).to eq('ui://avalia-solar/categories/v1.html')
  end

  it 'keeps resources hidden when MCP_UI_ENABLED is false' do
    allow(ENV).to receive(:[]).with('MCP_UI_ENABLED').and_return('false')

    legacy_rpc('resources/list')
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_601)
  end
end
