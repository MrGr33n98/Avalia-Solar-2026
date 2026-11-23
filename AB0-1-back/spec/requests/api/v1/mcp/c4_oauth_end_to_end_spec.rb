# frozen_string_literal: true

require 'rails_helper'
require 'base64'
require 'digest'

# A contiguous, real Doorkeeper -> Rails resource server -> MCP request test.
# Does not use a mocked OAuth verifier or hardcoded access token.
RSpec.describe 'C4 OAuth issuance, MCP use and revocation', type: :request do
  let(:issuer) { 'https://mcp.example.test' }
  let(:public_resource) { 'https://mcp.example.test/mcp' }
  let(:private_resource) { 'https://mcp.example.test/mcp/private' }
  let(:user) { create(:user, :confirmed, status: :active) }
  let(:verifier) { 'verifier-' + ('c' * 40) }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let(:redirect_uri) { 'https://client.example.test/oauth/callback' }
  let(:redis) { double('Redis', call: 1) }

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    {
      'MCP_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_REMOTE_AUTH_MODE' => 'oauth',
      'MCP_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_OAUTH_TOKEN_FORMAT' => 'opaque',
      'MCP_OAUTH_RESOURCE' => public_resource,
      'MCP_OAUTH_ISSUER' => issuer,
      'MCP_REMOTE_ALLOWED_HOSTS' => 'mcp.example.test',
      'MCP_REMOTE_ALLOWED_ORIGINS' => '',
      'MCP_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PUBLIC_TOOLS_EXECUTION_ENABLED' => 'true',
      'MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED' => 'true',
      'MCP_PRIVATE_REMOTE_OAUTH_ENABLED' => 'true',
      'MCP_PRIVATE_REMOTE_POLICY_ENABLED' => 'true',
      'MCP_PRIVATE_OAUTH_RESOURCE' => private_resource,
      'MCP_PRIVATE_ALLOWED_HOSTS' => 'mcp.example.test',
      'MCP_PRIVATE_ALLOWED_ORIGINS' => ''
    }.each do |key, value|
      allow(ENV).to receive(:[]).with(key).and_return(value)
    end
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
    allow(Sidekiq).to receive(:redis).and_yield(redis)
  end

  def oauth_client(scope)
    Doorkeeper::Application.create!(
      name: 'C4 authorized MCP client',
      redirect_uri: redirect_uri,
      scopes: scope,
      confidential: false,
      secret: nil
    )
  end

  def exchange_authorization_code(scope:, resource:)
    client = oauth_client(scope)
    sign_in user
    get '/oauth/authorize', params: {
      client_id: client.uid,
      redirect_uri: redirect_uri,
      response_type: 'code',
      scope: scope,
      state: 'c4-oauth-state',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      resource: resource
    }

    expect(response).to have_http_status(:ok)
    form = Nokogiri::HTML(response.body).at_css('form[method="post"]')
    expect(form).to be_present
    form_params = form.css('input[type="hidden"]').to_h do |input|
      [input['name'], input['value']]
    end

    post '/oauth/authorize', params: form_params
    expect(response).to be_redirect
    authorization_code = URI.decode_www_form(URI(response.location).query.to_s).to_h.fetch('code')

    post '/oauth/token', params: {
      grant_type: 'authorization_code',
      client_id: client.uid,
      code: authorization_code,
      redirect_uri: redirect_uri,
      code_verifier: verifier,
      resource: resource
    }

    expect(response).to have_http_status(:ok)
    [client, response.parsed_body.fetch('access_token'), response.parsed_body.fetch('refresh_token')]
  end

  def legacy_request(method, bearer:, params:, id: 'c4-legacy')
    request_headers = {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2025-11-25',
      'Host' => 'mcp.example.test',
      'Authorization' => "Bearer #{bearer}"
    }
    post '/mcp', params: { jsonrpc: '2.0', id: id, method: method, params: params }.to_json,
         headers: request_headers
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
    request_headers = {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => method,
      'Host' => 'mcp.example.test',
      'Authorization' => "Bearer #{bearer}"
    }
    request_headers['Mcp-Name'] = name if name

    post '/mcp', params: {
      jsonrpc: '2.0', id: 'c4-integration', method: method, params: params
    }.to_json, headers: request_headers
  end

  it 'issues a scoped OAuth code+PKCE token, executes one public tool, then denies a revoked token' do
    create(:company, name: 'C4 Aurora Solar', status: :active)
    client, token, _refresh = exchange_authorization_code(
      scope: 'mcp:public:read', resource: public_resource
    )
    legacy_request('initialize', bearer: token, id: 'c4-initialize', params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'c4-oauth-test', version: '1' }
    })

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'protocolVersion')).to eq('2025-11-25')

    modern_request('tools/list', bearer: token)

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'tools').map { |t| t.fetch('name') })
      .to eq(Mcp::PublicToolRegistry.names)

    modern_request('tools/call', bearer: token, name: 'list_integrators',
                   arguments: { query: 'C4 Aurora Solar', limit: 5 })
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'structuredContent', 'data', 'integrators')).to be_an(Array)

    post '/oauth/revoke', params: { client_id: client.uid, token: token }
    expect(response).to have_http_status(:ok)

    modern_request('tools/list', bearer: token)
    expect(response).to have_http_status(:unauthorized)
  end

  it 'separates a real private token resource from the public MCP endpoint' do
    _, private_token, _refresh = exchange_authorization_code(
      scope: 'mcp:company:read', resource: private_resource
    )
    modern_request('tools/list', bearer: private_token)
    expect(response).to have_http_status(:unauthorized)
  end

  it 'returns only the authenticated member company through a real private OAuth grant' do
    plan = create(:plan, features: { advanced_analytics: true, dashboard_access: true })
    own = create(:company, plan: plan, status: :active)
    other = create(:company, plan: plan, status: :active)
    create(:company_member, user: user, company: own, status: :active)

    _, private_token, _refresh = exchange_authorization_code(
      scope: 'mcp:company:read', resource: private_resource
    )
    request_headers = {
      'CONTENT_TYPE' => 'application/json',
      'Host' => 'mcp.example.test',
      'Authorization' => "Bearer #{private_token}"
    }
    payload = lambda do |id|
      {
        jsonrpc: '2.0', id: 'c4-private', method: 'tools/call',
        params: { name: 'get_my_company_overview', arguments: { company_id: id } }
      }.to_json
    end

    post '/mcp/private', params: payload.call(own.id), headers: request_headers
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'structuredContent', 'company', 'id')).to eq(own.id)

    post '/mcp/private', params: payload.call(other.id), headers: request_headers
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)
    expect(response.body).not_to include(other.name)
  end
end
