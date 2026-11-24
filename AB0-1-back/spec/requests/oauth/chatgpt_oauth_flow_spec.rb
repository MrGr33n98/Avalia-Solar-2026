# frozen_string_literal: true

require 'rails_helper'
require 'base64'
require 'digest'

RSpec.describe 'ChatGPT OAuth and MCP End-to-End Interoperability', type: :request do
  let(:staging_host) { 'mcp-staging.avaliasolar.com.br' }
  let(:resource_url) { 'https://mcp-staging.avaliasolar.com.br/mcp' }
  let(:issuer_url) { 'https://mcp-staging.avaliasolar.com.br' }
  let(:client_id) { 'OVJY8XT0x82_d8DuGF-Es4h-tbOWoHgsCRDYeGuvxpM' }
  let(:chatgpt_callback) { 'https://chatgpt.com/connector/oauth/iwgnUmlxR3DA' }
  let(:user) { create(:user, :confirmed, id: 1, status: :active) }
  let(:verifier) { "chatgpt-verifier-#{'a' * 35}" }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let(:redis) { double('Redis', call: 1) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    {
      'MCP_STAGING_MODE' => 'true',
      'MCP_REMOTE_PRODUCTION_ENABLED' => 'true',
      'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_REMOTE_AUTH_MODE' => 'oauth',
      'MCP_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
      'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
      'MCP_OAUTH_RESOURCE' => resource_url,
      'MCP_OAUTH_ISSUER' => issuer_url,
      'MCP_REMOTE_ALLOWED_HOSTS' => staging_host,
      'MCP_REMOTE_ALLOWED_ORIGINS' => '',
      'MCP_CANARY_ENABLED' => 'true',
      'MCP_CANARY_PHASE' => 'read_only',
      'MCP_CANARY_ALLOWED_CLIENT_IDS' => client_id,
      'MCP_CANARY_ALLOWED_SUBJECTS' => 'user:1,user:2,user:3,user:5'
    }.each { |k, v| allow(ENV).to receive(:[]).with(k).and_return(v) }
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
    allow(ENV).to receive(:fetch).with('MCP_CANARY_PHASE', 'disabled').and_return('read_only')
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_TOKEN_FORMAT', 'opaque').and_return('opaque')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  let!(:application) do
    Doorkeeper::Application.create!(
      name: 'ChatGPT Avalia Solar MCP',
      uid: client_id,
      redirect_uri: "#{chatgpt_callback}\nhttps://chatgpt.com/connector/oauth\nhttps://chat.openai.com/aip/plugin-mcp/oauth/callback",
      scopes: 'mcp:public:read',
      confidential: false,
      secret: nil
    )
  end

  describe 'Phase 1: OAuth Discovery' do
    it 'exposes root and resource-specific metadata' do
      get '/.well-known/oauth-protected-resource', headers: { 'Host' => staging_host }
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['resource']).to eq(resource_url)
      expect(body['authorization_servers']).to eq([issuer_url])
      expect(body['scopes_supported']).to eq(['mcp:public:read'])

      get '/.well-known/oauth-protected-resource/mcp', headers: { 'Host' => staging_host }
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['resource']).to eq(resource_url)

      get '/.well-known/oauth-authorization-server', headers: { 'Host' => staging_host }
      expect(response).to have_http_status(:ok)
      as_body = JSON.parse(response.body)
      expect(as_body['issuer']).to eq(issuer_url)
      expect(as_body['authorization_endpoint']).to eq("#{issuer_url}/oauth/authorize")
      expect(as_body['token_endpoint']).to eq("#{issuer_url}/oauth/token")
      expect(as_body['code_challenge_methods_supported']).to eq(['S256'])

      get '/.well-known/openid-configuration', headers: { 'Host' => staging_host }
      expect(response).to have_http_status(:ok)
    end
  end

  describe 'Phase 2: Authorization Request and Consent' do
    it 'redirects unauthenticated user safely to sign_in without UnsafeRedirectError' do
      get '/oauth/authorize', params: {
        client_id: client_id,
        redirect_uri: chatgpt_callback,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 'test_state_123',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:redirect)
      expect(response.location).to end_with('/users/sign_in')
    end

    it 'renders consent screen and grants code upon user authorization' do
      sign_in user

      get '/oauth/authorize', params: {
        client_id: client_id,
        redirect_uri: chatgpt_callback,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 'state_xyz',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:ok)
      expect(response.body).to include('Autorizar Conexão')
      expect(response.body).to include('mcp:public:read')

      # User submits consent
      post '/oauth/authorize', params: {
        client_id: client_id,
        redirect_uri: chatgpt_callback,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 'state_xyz',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:redirect)
      expect(response.location).to start_with(chatgpt_callback)

      uri = URI(response.location)
      query = URI.decode_www_form(uri.query.to_s).to_h
      expect(query['code']).to be_present
      expect(query['state']).to eq('state_xyz')
    end

    it 'denies authorization when subject is not in canary allowlist' do
      unauthorized_user = create(:user, :confirmed, id: 999, status: :active)
      sign_in unauthorized_user

      get '/oauth/authorize', params: {
        client_id: client_id,
        redirect_uri: chatgpt_callback,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 'state_unauth',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'Phase 3: Token Exchange (RFC 8707 & PKCE)' do
    def issue_code
      sign_in user
      post '/oauth/authorize', params: {
        client_id: client_id,
        redirect_uri: chatgpt_callback,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 's1',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      uri = URI(response.location)
      URI.decode_www_form(uri.query.to_s).to_h.fetch('code')
    end

    it 'successfully exchanges code when resource is omitted (RFC 8707 §2 compliance)' do
      code = issue_code

      post '/oauth/token', params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        code: code,
        redirect_uri: chatgpt_callback,
        code_verifier: verifier
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['token_type']).to eq('Bearer')
      expect(body['access_token']).to be_present
      expect(body['refresh_token']).to be_present
      expect(body['scope']).to eq('mcp:public:read')

      token = Doorkeeper::AccessToken.last
      expect(token.resource).to eq(resource_url)
      expect(token.resource_owner_id).to eq(user.id)
    end

    it 'successfully exchanges code when resource is explicitly passed' do
      code = issue_code

      post '/oauth/token', params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        code: code,
        redirect_uri: chatgpt_callback,
        code_verifier: verifier,
        resource: resource_url
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['access_token']).to be_present
    end

    it 'rejects token exchange when conflicting resource is passed' do
      code = issue_code

      post '/oauth/token', params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        code: code,
        redirect_uri: chatgpt_callback,
        code_verifier: verifier,
        resource: 'https://attacker.example.com/mcp'
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['error']).to eq('invalid_target')
    end

    it 'rejects invalid PKCE code_verifier' do
      code = issue_code

      post '/oauth/token', params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        code: code,
        redirect_uri: chatgpt_callback,
        code_verifier: 'wrong-verifier-12345'
      }, headers: { 'Host' => staging_host }

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['error']).to eq('invalid_grant')
    end
  end

  describe 'Phase 4: MCP Protocol Negotiation and Tool Execution' do
    let(:access_token) do
      grant = Doorkeeper::AccessGrant.create!(
        resource_owner_id: user.id,
        application_id: application.id,
        token: SecureRandom.hex(32),
        expires_in: 600,
        redirect_uri: chatgpt_callback,
        scopes: 'mcp:public:read',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        resource: resource_url
      )
      post '/oauth/token', params: {
        grant_type: 'authorization_code',
        client_id: client_id,
        code: grant.plaintext_token,
        redirect_uri: chatgpt_callback,
        code_verifier: verifier
      }, headers: { 'Host' => staging_host }

      JSON.parse(response.body).fetch('access_token')
    end

    let(:mcp_headers) do
      {
        'Host' => staging_host,
        'Authorization' => "Bearer #{access_token}",
        'CONTENT_TYPE' => 'application/json',
        'ACCEPT' => 'application/json, text/event-stream',
        'MCP-Protocol-Version' => '2025-11-25'
      }
    end

    it 'accepts initialize with standard headers' do
      post '/mcp', params: {
        jsonrpc: '2.0', id: 1, method: 'initialize',
        params: {
          protocolVersion: '2025-11-25',
          capabilities: {},
          clientInfo: { name: 'ChatGPT', version: '1.0.0' }
        }
      }.to_json, headers: mcp_headers

      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body)['result']
      expect(result['capabilities']).to be_a(Hash)
      expect(result['serverInfo']['name']).to eq('avalia-solar-mcp-preview')
    end

    it 'accepts notifications/initialized without id' do
      post '/mcp', params: {
        jsonrpc: '2.0', method: 'notifications/initialized'
      }.to_json, headers: mcp_headers

      expect(response).to have_http_status(:accepted)
    end

    it 'lists all 5 public tools via tools/list' do
      post '/mcp', params: {
        jsonrpc: '2.0', id: 2, method: 'tools/list', params: {}
      }.to_json, headers: mcp_headers

      expect(response).to have_http_status(:ok)
      tools = JSON.parse(response.body)['result']['tools']
      expect(tools.map { |t| t['name'] }).to contain_exactly(
        'list_integrators',
        'show_integrator_profile',
        'list_solar_categories',
        'get_integrator_reputation',
        'compare_integrators'
      )
    end

    it 'executes public tool list_solar_categories successfully' do
      post '/mcp', params: {
        jsonrpc: '2.0', id: 3, method: 'tools/call',
        params: { name: 'list_solar_categories', arguments: {} }
      }.to_json, headers: mcp_headers

      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body)['result']
      expect(result['isError']).to be(false)
      expect(result['content']).to be_an(Array)
    end

    it 'denies execution of non-public tools' do
      post '/mcp', params: {
        jsonrpc: '2.0', id: 4, method: 'tools/call',
        params: { name: 'bulk_lead_export', arguments: {} }
      }.to_json, headers: mcp_headers

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']['code']).to eq(-32_001)
    end
  end
end
