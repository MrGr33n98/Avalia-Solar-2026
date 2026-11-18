# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP Private tenant authorization', type: :request do
  let(:issuer) { 'https://mcp.example.test' }
  let(:resource) { 'https://mcp.example.test/mcp/private' }
  let(:plan_features) { { advanced_analytics: true, dashboard_access: true } }
  let(:plan) { create(:plan, features: plan_features) }
  let(:company_a) { create(:company, plan: plan) }
  let(:company_b) { create(:company, plan: plan) }
  let(:user_a) { create(:user, :confirmed, status: :active, company: company_a) }
  let(:user_b) { create(:user, :confirmed, status: :active, company: company_b) }
  let!(:membership_a) { create(:company_member, user: user_a, company: company_a, status: :active) }
  let!(:membership_b) { create(:company_member, user: user_b, company: company_b, status: :active) }
  let(:application) do
    Doorkeeper::Application.create!(
      name: 'Cliente MCP privado', redirect_uri: 'https://client.example.test/callback',
      scopes: 'mcp:company:read', confidential: false, secret: nil
    )
  end
  let(:access_token) do
    Doorkeeper::AccessToken.create!(
      application: application, resource_owner_id: user_a.id, scopes: 'mcp:company:read',
      resource: resource, expires_in: 600, use_refresh_token: false
    )
  end
  let(:headers) do
    {
      'CONTENT_TYPE' => 'application/json',
      'ACCEPT' => 'application/json',
      'Host' => 'mcp.example.test',
      'Authorization' => "Bearer #{access_token.plaintext_token}"
    }
  end

  before do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_OAUTH_RESOURCE').and_return(resource)
    allow(ENV).to receive(:[]).with('MCP_OAUTH_ISSUER').and_return(issuer)
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_ALLOWED_HOSTS').and_return('mcp.example.test')
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_ALLOWED_ORIGINS').and_return('')
  end

  def call_tool(arguments: {})
    post '/mcp/private', params: {
      jsonrpc: '2.0', id: 'private-1', method: 'tools/call',
      params: { name: 'get_my_company_overview', arguments: arguments }
    }.to_json, headers: headers
  end

  def call_tool_with(token, arguments: {})
    post '/mcp/private', params: {
      jsonrpc: '2.0', id: 'private-1', method: 'tools/call',
      params: { name: 'get_my_company_overview', arguments: arguments }
    }.to_json, headers: headers.merge('Authorization' => "Bearer #{token.plaintext_token}")
  end

  it 'permite a ferramenta apenas para a empresa do membership ativo' do
    call_tool

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('result', 'structuredContent', 'company', 'id')).to eq(company_a.id)
    expect(response.body).not_to include(user_a.email)
  end

  it 'nega a seleção de outra empresa mesmo quando o parâmetro é enviado' do
    call_tool(arguments: { company_id: company_b.id })

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)
  end

  it 'nega User B ao tentar selecionar a empresa A' do
    token_b = Doorkeeper::AccessToken.create!(
      application: application, resource_owner_id: user_b.id, scopes: 'mcp:company:read',
      resource: resource, expires_in: 600, use_refresh_token: false
    )

    call_tool_with(token_b, arguments: { company_id: company_a.id })

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)
  end

  it 'nega requisição sem bearer token' do
    post '/mcp/private', params: {
      jsonrpc: '2.0', id: 'private-anonymous', method: 'tools/list', params: {}
    }.to_json, headers: headers.except('Authorization')

    expect(response).to have_http_status(:unauthorized)
  end

  it 'nega token público no recurso privado' do
    access_token.update!(resource: 'https://mcp.example.test/mcp', scopes: 'mcp:public:read')
    call_tool

    expect(response).to have_http_status(:unauthorized)
  end

  it 'nega scope privado ausente' do
    access_token.update!(scopes: 'mcp:public:read')
    call_tool

    expect(response).to have_http_status(:forbidden)
    expect(response.headers['WWW-Authenticate']).to include('mcp:company:read')
  end

  it 'nega token revogado' do
    access_token.revoke
    call_tool

    expect(response).to have_http_status(:unauthorized)
  end

  it 'nega empresa inativa' do
    company_a.update_column(:status, 'inactive')
    call_tool

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)
  end

  it 'nega membership revogado' do
    membership_a.update!(status: :revoked)
    call_tool

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)
  end

  it 'exige seleção explícita quando o usuário tem múltiplas empresas' do
    company_c = create(:company, plan: plan)
    create(:company_member, user: user_a, company: company_c, status: :active)

    call_tool
    expect(response.parsed_body.dig('error', 'code')).to eq(-32_003)

    call_tool(arguments: { company_id: company_c.slug })
    expect(response.parsed_body.dig('result', 'structuredContent', 'company', 'id')).to eq(company_c.id)
  end

  it 'mantém a fronteira privada desligada por padrão' do
    allow(ENV).to receive(:[]).with('MCP_PRIVATE_REMOTE_TRANSPORT_ENABLED').and_return('false')
    call_tool

    expect(response).to have_http_status(:not_found)
  end

  it 'publica metadata privada somente quando configurada' do
    get '/.well-known/oauth-protected-resource/mcp/private'

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to include(
      'resource' => resource,
      'authorization_servers' => [issuer],
      'scopes_supported' => ['mcp:company:read']
    )
  end

  it 'aceita o resource privado no Authorization Server antes da validação do code' do
    post '/oauth/token', params: {
      grant_type: 'authorization_code', client_id: application.uid,
      code: SecureRandom.hex(16), redirect_uri: application.redirect_uri,
      code_verifier: 'verifier', resource: resource
    }

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body['error']).not_to eq('invalid_target')
  end
end
