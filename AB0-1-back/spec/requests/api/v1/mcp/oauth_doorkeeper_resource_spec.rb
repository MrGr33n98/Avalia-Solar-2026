# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP OAuth Doorkeeper resource integration', type: :request do
  let(:issuer) { 'https://mcp.example.test' }
  let(:resource) { 'https://mcp.example.test/mcp' }
  let(:user) { create(:user, :confirmed, status: :active) }
  let(:application) do
    Doorkeeper::Application.create!(
      name: 'Cliente MCP opaco', redirect_uri: 'https://client.example.test/callback',
      scopes: 'mcp:public:read', confidential: false, secret: nil
    )
  end
  let!(:access_token) do
    Doorkeeper::AccessToken.create!(
      application: application, resource_owner_id: user.id, scopes: 'mcp:public:read',
      resource: resource, expires_in: 600, use_refresh_token: false
    )
  end
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => 'tools/list',
      'Host' => 'mcp.example.test'
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('oauth')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_TOKEN_FORMAT').and_return('opaque')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(resource)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return(issuer)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('mcp.example.test')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('')
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
  end

  def list_payload
    {
      jsonrpc: '2.0', id: 'opaque-list', method: 'tools/list',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      }
    }
  end

  it 'aceita token opaco emitido e persistido pelo Doorkeeper' do
    request_headers = headers.merge('Authorization' => "Bearer #{access_token.plaintext_token}")
    post '/mcp', params: list_payload.to_json, headers: request_headers

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'tools').map { |tool| tool.fetch('name') })
      .to eq(Mcp::PublicToolRegistry.names)
  end

  it 'nega token opaco revogado pelo Doorkeeper' do
    raw_token = access_token.plaintext_token
    access_token.revoke

    post '/mcp', params: list_payload.to_json, headers: headers.merge('Authorization' => "Bearer #{raw_token}")

    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejeita audience/resource que não corresponde ao MCP' do
    access_token.update!(resource: 'https://other.example/mcp')

    request_headers = headers.merge('Authorization' => "Bearer #{access_token.plaintext_token}")
    post '/mcp', params: list_payload.to_json, headers: request_headers

    expect(response).to have_http_status(:unauthorized)
  end

  it 'publica metadata do Authorization Server sem segredos' do
    get '/.well-known/oauth-authorization-server'

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      'issuer' => issuer,
      'authorization_endpoint' => 'https://mcp.example.test/oauth/authorize',
      'token_endpoint' => 'https://mcp.example.test/oauth/token',
      'revocation_endpoint' => 'https://mcp.example.test/oauth/revoke',
      'code_challenge_methods_supported' => ['S256']
    )
    expect(response.body).not_to include('PRIVATE KEY')
  end

  it 'rejeita resource incorreto antes de emitir token' do
    post '/oauth/token', params: {
      grant_type: 'authorization_code', client_id: application.uid,
      code: SecureRandom.hex(16), redirect_uri: application.redirect_uri,
      code_verifier: 'verifier', resource: 'https://other.example/mcp'
    }

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error']).to eq('invalid_target')
  end
end
