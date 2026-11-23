# frozen_string_literal: true

require 'rails_helper'
require 'base64'
require 'digest'

RSpec.describe 'MCP production canary guard', type: :request do
  let(:user) { create(:user, :confirmed, status: :active) }
  let(:verifier) { "canary-verifier-#{'x' * 32}" }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let(:redirect_uri) { 'https://client-owner.example/oauth/callback' }
  let(:resource) { Mcp::Canary::Configuration::CANONICAL_RESOURCE }
  let(:issuer) { Mcp::Canary::Configuration::CANONICAL_ISSUER }
  let(:redis) { double('Redis', call: 1) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    {
      'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_REMOTE_PRODUCTION_ENABLED' => 'false',
      'MCP_REMOTE_AUTH_MODE' => 'oauth',
      'MCP_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
      'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
      'MCP_OAUTH_RESOURCE' => resource,
      'MCP_OAUTH_ISSUER' => issuer,
      'MCP_REMOTE_ALLOWED_HOSTS' => 'api.avaliasolar.com.br',
      'MCP_REMOTE_ALLOWED_ORIGINS' => '',
      'MCP_CANARY_ENABLED' => 'true',
      'MCP_CANARY_ALLOWED_CLIENT_IDS' => '',
      'MCP_CANARY_ALLOWED_SUBJECTS' => '',
      'MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED' => 'false',
      'MCP_PRIVATE_REMOTE_OAUTH_ENABLED' => 'false',
      'MCP_PRIVATE_REMOTE_POLICY_ENABLED' => 'false'
    }.each { |key, value| allow(ENV).to receive(:[]).with(key).and_return(value) }
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('discovery')
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  def client_and_token(phase: 'discovery', user_record: user)
    client = create_canary_client
    configure_canary_allowlist(client, user_record, phase)
    grant = create_canary_grant(client, user_record)
    exchange_canary_grant(client, grant)
  end

  def create_canary_client
    Doorkeeper::Application.create!(
      name: 'Canary review client', redirect_uri: redirect_uri,
      scopes: 'mcp:public:read', confidential: false, secret: nil
    )
  end

  def configure_canary_allowlist(client, user_record, phase)
    allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_CLIENT_IDS').and_return(client.uid)
    allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_SUBJECTS').and_return("user:#{user_record.id}")
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return(phase)
  end

  def create_canary_grant(client, user_record)
    Doorkeeper::AccessGrant.create!(
      resource_owner_id: user_record.id, application_id: client.id,
      token: SecureRandom.hex(32), expires_in: 600, redirect_uri: redirect_uri,
      scopes: 'mcp:public:read', code_challenge: challenge,
      code_challenge_method: 'S256', resource: resource
    )
  end

  def exchange_canary_grant(client, grant)
    post '/oauth/token', params: {
      grant_type: 'authorization_code', client_id: client.uid,
      code: grant.plaintext_token, redirect_uri: redirect_uri,
      code_verifier: verifier, resource: resource
    }
    expect(response).to have_http_status(:ok)
    [client, response.parsed_body.fetch('access_token'), response.parsed_body.fetch('refresh_token')]
  end

  def modern_request(method, bearer:, name: nil, arguments: {})
    params = {
      _meta: {
        'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
        'io.modelcontextprotocol/clientCapabilities' => {}
      }
    }
    params[:name] = name if name
    params[:arguments] = arguments if name
    headers = {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28', 'Mcp-Method' => method,
      'Host' => 'api.avaliasolar.com.br', 'Authorization' => "Bearer #{bearer}"
    }
    headers['Mcp-Name'] = name if name
    post '/mcp', params: { jsonrpc: '2.0', id: 'canary', method: method, params: params }.to_json,
                 headers: headers
  end

  it 'keeps the endpoint hidden when the canary flag is disabled' do
    allow(ENV).to receive(:[]).with('MCP_CANARY_ENABLED').and_return('false')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('false')

    post '/mcp', params: { jsonrpc: '2.0', id: 1, method: 'ping' }.to_json,
                 headers: { 'CONTENT_TYPE' => 'application/json', 'Host' => 'api.avaliasolar.com.br' }
    expect(response).to have_http_status(:not_found)
  end

  it 'rejects an incomplete canary configuration without revealing its contents' do
    client = Doorkeeper::Application.create!(name: 'Unconfigured canary client', redirect_uri: redirect_uri,
                                             scopes: 'mcp:public:read', confidential: false, secret: nil)
    modern_request('tools/list', bearer: 'not-a-token')
    expect(response).to have_http_status(:unauthorized)
    expect(response.body).not_to include(client.uid, 'MCP_CANARY_ALLOWED')
  end

  it 'allows OAuth PKCE discovery with a matching client and internal subject' do
    _client, token = client_and_token
    modern_request('tools/list', bearer: token)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'tools').map { |tool| tool.fetch('name') })
      .to eq(Mcp::PublicToolRegistry.names)
  end

  it 'blocks tools/call during discovery before executing a public tool' do
    _client, token = client_and_token
    expect(Mcp::Public::Executor).not_to receive(:call)
    modern_request('tools/call', bearer: token, name: 'list_integrators', arguments: {})

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
  end

  it 'allows only the five public tools in read-only phase' do
    create(:company, name: 'Canary Solar Company', status: :active)
    _client, token = client_and_token(phase: 'read_only')
    modern_request('tools/call', bearer: token, name: 'list_integrators', arguments: { query: 'Canary', limit: 5 })

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'isError')).to be(false)

    modern_request('tools/call', bearer: token, name: 'bulk_lead_export', arguments: {})
    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
    expect(response.body).not_to include('bulk_lead_export')
  end

  it 'executes authorized public tools under the legacy protocol in read-only phase' do
    create(:company, name: 'Canary Solar Company', status: :active)
    _client, token = client_and_token(phase: 'read_only')
    post '/mcp', params: {
      jsonrpc: '2.0', id: 22, method: 'tools/call',
      params: { name: 'list_integrators', arguments: { query: 'Canary', limit: 5 } }
    }.to_json, headers: {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25', 'Host' => 'api.avaliasolar.com.br',
      'Authorization' => "Bearer #{token}"
    }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'isError')).to be(false)
  end

  it 'blocks legacy tools/call during discovery phase or for non-public tools without bypass' do
    _client, token = client_and_token(phase: 'discovery')
    post '/mcp', params: {
      jsonrpc: '2.0', id: 22, method: 'tools/call',
      params: { name: 'list_integrators', arguments: {} }
    }.to_json, headers: {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25', 'Host' => 'api.avaliasolar.com.br',
      'Authorization' => "Bearer #{token}"
    }

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)

    _client2, token2 = client_and_token(phase: 'read_only')
    post '/mcp', params: {
      jsonrpc: '2.0', id: 23, method: 'tools/call',
      params: { name: 'bulk_lead_export', arguments: {} }
    }.to_json, headers: {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25', 'Host' => 'api.avaliasolar.com.br',
      'Authorization' => "Bearer #{token2}"
    }

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_001)
  end

  it 'accepts notifications/initialized under canary guard for authorized clients' do
    _client, token = client_and_token(phase: 'discovery')
    post '/mcp', params: {
      jsonrpc: '2.0', method: 'notifications/initialized'
    }.to_json, headers: {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25', 'Host' => 'api.avaliasolar.com.br',
      'Authorization' => "Bearer #{token}"
    }

    expect(response).to have_http_status(:accepted)
    expect(response.body).to be_blank
  end

  it 'accepts modern notifications/initialized under canary guard for authorized clients' do
    _client, token = client_and_token(phase: 'discovery')
    post '/mcp', params: {
      jsonrpc: '2.0', method: 'notifications/initialized',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      }
    }.to_json, headers: {
      'CONTENT_TYPE' => 'application/json', 'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28', 'Mcp-Method' => 'notifications/initialized',
      'Host' => 'api.avaliasolar.com.br', 'Authorization' => "Bearer #{token}"
    }

    expect(response).to have_http_status(:accepted)
    expect(response.body).to be_blank
  end

  it 'rejects an invalid token before the canary guard' do
    modern_request('tools/list', bearer: 'invalid-opaque-token')

    expect(response).to have_http_status(:unauthorized)
    expect(response.body).not_to include('invalid-opaque-token')
  end

  it 'renews an authorized public token through Doorkeeper refresh' do
    client, _access_token, refresh_token = client_and_token
    post '/oauth/token', params: {
      grant_type: 'refresh_token', client_id: client.uid,
      refresh_token: refresh_token, resource: resource
    }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.fetch('access_token')).to be_present
  end

  it 'rejects refresh with a client outside the canary allowlist' do
    _client, _access_token, refresh_token = client_and_token
    other_client = Doorkeeper::Application.create!(
      name: 'Unauthorized refresh client', redirect_uri: redirect_uri,
      scopes: 'mcp:public:read', confidential: false, secret: nil
    )
    post '/oauth/token', params: {
      grant_type: 'refresh_token', client_id: other_client.uid,
      refresh_token: refresh_token, resource: resource
    }

    expect(response).to have_http_status(:forbidden)
  end

  it 'rejects refresh when the token subject is no longer allowlisted' do
    client, _access_token, refresh_token = client_and_token
    allow(ENV).to receive(:[]).with('MCP_CANARY_ALLOWED_SUBJECTS').and_return('user:999999')
    post '/oauth/token', params: {
      grant_type: 'refresh_token', client_id: client.uid,
      refresh_token: refresh_token, resource: resource
    }

    expect(response).to have_http_status(:forbidden)
  end

  it 'rejects refresh after the source access token is revoked' do
    client, access_token, refresh_token = client_and_token
    post '/oauth/revoke', params: { client_id: client.uid, token: access_token }
    expect(response).to have_http_status(:ok)

    post '/oauth/token', params: {
      grant_type: 'refresh_token', client_id: client.uid,
      refresh_token: refresh_token, resource: resource
    }

    expect(response).to have_http_status(:forbidden)
  end

  it 'keeps private MCP disabled even when the public canary is configured' do
    _client, token = client_and_token
    post '/mcp/private', params: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }.to_json,
                         headers: {
                           'CONTENT_TYPE' => 'application/json', 'Host' => 'api.avaliasolar.com.br',
                           'Authorization' => "Bearer #{token}"
                         }

    expect(response).to have_http_status(:not_found)
  end
end
