# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP OAuth protected resource', type: :request do
  let(:rsa) { OpenSSL::PKey::RSA.generate(2048) }
  let(:issuer) { 'https://issuer.example.com' }
  let(:resource) { 'https://www.example.com/mcp' }
  let(:valid_scope) { 'mcp:public:read' }
  let(:base_headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json, text/event-stream',
      'MCP-Protocol-Version' => '2026-07-28',
      'Mcp-Method' => 'tools/list'
    }
  end
  let(:claims) do
    {
      iss: issuer, aud: resource, sub: 'test-subject',
      exp: (Time.current + 5.minutes).to_i, iat: Time.current.to_i,
      jti: SecureRandom.uuid, scope: valid_scope
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_AUTH_MODE').and_return('oauth')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_TOKEN_FORMAT').and_return('jwt')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(resource)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return(issuer)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_HOSTS').and_return('www.example.com')
    allow(ENV).to receive(:[]).with('MCP_REMOTE_ALLOWED_ORIGINS').and_return('https://trusted.example')
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return(rsa.public_key.to_pem)
    allow(ENV).to receive(:fetch).with('MCP_REMOTE_AUTH_MODE', 'preview').and_return('oauth')
  end

  def access_token(data: claims, key: rsa, type: 'at+jwt')
    JWT.encode(data, key, 'RS256', { typ: type, kid: 'test-key-1' })
  end

  def call_list(extra_headers = {})
    data = {
      jsonrpc: '2.0', id: 'list-01', method: 'tools/list',
      params: {
        _meta: {
          'io.modelcontextprotocol/protocolVersion' => '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities' => {}
        }
      }
    }
    post '/mcp', params: data.to_json, headers: base_headers.merge(extra_headers)
  end

  it 'publishes RFC 9728 resource metadata without authentication in configured OAuth mode' do
    get '/.well-known/oauth-protected-resource/mcp'
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      'resource' => resource,
      'authorization_servers' => [issuer],
      'scopes_supported' => [valid_scope],
      'bearer_methods_supported' => ['header']
    )
    expect(response.body).not_to include('PRIVATE KEY')

    get '/.well-known/oauth-protected-resource'
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq(
      'resource' => resource,
      'authorization_servers' => [issuer],
      'scopes_supported' => [valid_scope],
      'bearer_methods_supported' => ['header']
    )
  end

  it 'requires a bearer token and returns resource metadata link' do
    call_list
    expect(response).to have_http_status(:unauthorized)
    expect(response.headers['WWW-Authenticate']).to include('resource_metadata="https://www.example.com/.well-known/oauth-protected-resource/mcp"')
    expect(response.headers['WWW-Authenticate']).to include('error="invalid_token"')
  end

  it 'returns the five-tool allowlist to a valid scoped access token' do
    call_list('Authorization' => "Bearer #{access_token}")
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'tools').map { |tool| tool.fetch('name') }).to eq(Mcp::PublicToolRegistry.names)
  end

  it 'rejects a token issued for the wrong audience' do
    call_list('Authorization' => "Bearer #{access_token(data: claims.merge(aud: 'https://other.example.com/mcp'))}")
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects a token issued by the wrong authorization server' do
    call_list('Authorization' => "Bearer #{access_token(data: claims.merge(iss: 'https://malicious.example'))}")
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects invalid signatures, expired tokens, ID tokens and missing token IDs' do
    other_key = OpenSSL::PKey::RSA.generate(2048)
    scenarios = [
      { data: claims, key: other_key, type: 'at+jwt' },
      { data: claims.merge(exp: 1), key: rsa, type: 'at+jwt' },
      { data: claims, key: rsa, type: 'JWT' },
      { data: claims.except(:jti), key: rsa, type: 'at+jwt' }
    ]
    scenarios.each do |scenario|
      call_list('Authorization' => "Bearer #{access_token(**scenario)}")
      expect(response).to have_http_status(:unauthorized)
    end
  end

  it 'returns 403 with insufficient_scope for an otherwise valid token' do
    call_list('Authorization' => "Bearer #{access_token(data: claims.merge(scope: 'mcp:other'))}")
    expect(response).to have_http_status(:forbidden)
    expect(response.headers['WWW-Authenticate']).to include('error="insufficient_scope"')
    expect(response.headers['WWW-Authenticate']).to include('scope="mcp:public:read"')
  end

  it 'rejects an explicitly revoked token without disclosing its JTI' do
    token = access_token
    allow(Rails.cache).to receive(:read).and_call_original
    allow(Rails.cache).to receive(:read).with(a_string_starting_with('mcp:oauth:revoked:')).and_return(true)
    call_list('Authorization' => "Bearer #{token}")
    expect(response).to have_http_status(:unauthorized)
    expect(response.body).not_to include(claims[:jti])
  end

  it 'cannot be enabled without a valid resource server public key' do
    allow(ENV).to receive(:[]).with('MCP_OAUTH_JWT_PUBLIC_KEY').and_return('')
    get '/.well-known/oauth-protected-resource/mcp'
    expect(response).to have_http_status(:not_found)
    call_list('Authorization' => "Bearer #{access_token}")
    expect(response).to have_http_status(:not_found)
  end

  it 'does not accept the preview key as OAuth authentication' do
    call_list('X-MCP-Preview-Key' => 'mcp-modern-preview-example-key-at-least-thirty-two-bytes')
    expect(response).to have_http_status(:unauthorized)
  end

  it 'rejects a JWT missing required scope with no fallback to preview mode' do
    call_list('Authorization' => "Bearer #{access_token(data: claims.merge(scope: ''))}")
    expect(response).to have_http_status(:forbidden)
  end
end
