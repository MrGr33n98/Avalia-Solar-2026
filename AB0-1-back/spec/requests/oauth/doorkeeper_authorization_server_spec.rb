# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Doorkeeper Authorization Server', type: :request do
  let(:user) { create(:user, :confirmed, status: :active) }
  let(:redirect_uri) { 'https://client.example.test/oauth/callback' }
  let(:application) do
    Doorkeeper::Application.create!(
      name: 'Cliente MCP de teste',
      redirect_uri: redirect_uri,
      scopes: 'mcp:public:read',
      confidential: false,
      secret: nil
    )
  end
  let(:code_verifier) { "verifier-#{'a' * 35}" }

  def code_challenge(verifier)
    Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false)
  end

  def access_grant(verifier: code_verifier, expires_in: 600, created_at: Time.current)
    Doorkeeper::AccessGrant.create!(
      resource_owner_id: user.id,
      application_id: application.id,
      token: SecureRandom.hex(32),
      expires_in: expires_in,
      redirect_uri: redirect_uri,
      scopes: 'mcp:public:read',
      code_challenge: code_challenge(verifier),
      code_challenge_method: 'S256',
      resource: 'https://mcp.example.test/mcp',
      created_at: created_at
    )
  end

  def exchange(grant, verifier: code_verifier)
    post '/oauth/token', params: {
      grant_type: 'authorization_code',
      client_id: application.uid,
      code: grant.plaintext_token,
      redirect_uri: redirect_uri,
      code_verifier: verifier,
      resource: ENV['MCP_OAUTH_RESOURCE'].presence || 'https://mcp.example.test/mcp'
    }
  end

  def refresh(refresh_token)
    post '/oauth/token', params: {
      grant_type: 'refresh_token',
      client_id: application.uid,
      refresh_token: refresh_token,
      resource: ENV['MCP_OAUTH_RESOURCE'].presence || 'https://mcp.example.test/mcp'
    }
  end

  def confidential_client_and_grant
    client = Doorkeeper::Application.create!(
      name: 'Cliente MCP confidencial de teste',
      redirect_uri: redirect_uri,
      scopes: 'mcp:public:read',
      confidential: true,
      secret: nil
    )
    client_secret = client.plaintext_secret
    grant = Doorkeeper::AccessGrant.create!(
      resource_owner_id: user.id,
      application_id: client.id,
      token: SecureRandom.hex(32),
      expires_in: 600,
      redirect_uri: redirect_uri,
      scopes: 'mcp:public:read',
      code_challenge: code_challenge(code_verifier),
      code_challenge_method: 'S256',
      resource: ENV['MCP_OAUTH_RESOURCE'].presence || 'https://mcp.example.test/mcp'
    )

    [client, grant, client_secret]
  end

  it 'mantém o registro público PKCE sem secret compartilhado' do
    expect(application).to be_persisted
    expect(application).not_to be_confidential
  end

  it 'emite access e refresh tokens com PKCE S256 válido' do
    grant = access_grant

    exchange(grant)

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['token_type']).to eq('Bearer')
    expect(body['access_token']).to be_present
    expect(body['refresh_token']).to be_present
    expect(body['scope']).to eq('mcp:public:read')
    expect(Doorkeeper::AccessToken.last.resource_owner_id).to eq(user.id)
    expect(Doorkeeper::AccessToken.last.resource).to eq('https://mcp.example.test/mcp')
  end

  it 'rejeita code_verifier inválido e preserva a autorização não utilizada' do
    grant = access_grant

    exchange(grant, verifier: "verifier-#{'b' * 35}")

    expect(response).to have_http_status(:bad_request)
    expect(grant.reload).not_to be_revoked
  end

  it 'emite novo refresh token e preserva a referência da rotação' do
    grant = access_grant
    exchange(grant)
    first_response = JSON.parse(response.body)

    refresh(first_response.fetch('refresh_token'))

    expect(response).to have_http_status(:ok)
    second_response = JSON.parse(response.body)
    expect(second_response['refresh_token']).to be_present
    expect(second_response['refresh_token']).not_to eq(first_response['refresh_token'])
    expect(Doorkeeper::AccessToken.last.previous_refresh_token).to be_present
    expect(Doorkeeper::AccessToken.last.resource).to eq('https://mcp.example.test/mcp')
  end

  it 'rejeita authorization code expirado' do
    grant = access_grant(expires_in: 60, created_at: 2.hours.ago)

    exchange(grant)

    expect(response).to have_http_status(:bad_request)
    expect(JSON.parse(response.body)['error']).to eq('invalid_grant')
  end

  it 'rejeita cliente desconhecido' do
    post '/oauth/token', params: {
      grant_type: 'authorization_code',
      client_id: 'cliente-inexistente',
      code: SecureRandom.hex(16),
      redirect_uri: redirect_uri,
      code_verifier: code_verifier
    }

    expect(response).to have_http_status(:unauthorized)
  end

  it 'autentica clientes confidenciais por client_secret_post e client_secret_basic' do
    %i[post basic].each do |auth_method|
      client, grant, client_secret = confidential_client_and_grant
      params = {
        grant_type: 'authorization_code',
        code: grant.plaintext_token,
        redirect_uri: redirect_uri,
        code_verifier: code_verifier,
        resource: ENV['MCP_OAUTH_RESOURCE'].presence || 'https://mcp.example.test/mcp'
      }
      headers = {}

      if auth_method == :post
        params.merge!(client_id: client.uid, client_secret: client_secret)
      else
        credentials = Base64.strict_encode64("#{client.uid}:#{client_secret}")
        headers['HTTP_AUTHORIZATION'] = "Basic #{credentials}"
      end

      post '/oauth/token', params: params, headers: headers

      expect(response).to have_http_status(:ok), auth_method.to_s
      expect(response.parsed_body['access_token']).to be_present
    end
  end

  it 'revoga um access token emitido' do
    grant = access_grant
    exchange(grant)
    access_token_value = JSON.parse(response.body).fetch('access_token')
    token = Doorkeeper::AccessToken.last

    post '/oauth/revoke', params: {
      client_id: application.uid,
      token: access_token_value
    }

    expect(response).to have_http_status(:ok)
    expect(token.reload).to be_revoked
  end

  it 'não expõe introspecção nem cadastro administrativo de aplicações' do
    expect { post '/oauth/introspect', params: {} }
      .to raise_error(ActionController::RoutingError)

    expect { get '/oauth/applications' }
      .to raise_error(ActionController::RoutingError)
  end

  describe 'GET /oauth/authorize' do
    let(:resource) { 'https://mcp.example.test/mcp' }

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
      allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return(resource)
      allow(ENV).to receive(:[]).with('MCP_PRIVATE_REMOTE_OAUTH_ENABLED').and_return('false')
      allow(ENV).to receive(:[]).with('MCP_PRIVATE_OAUTH_RESOURCE').and_return('')
      sign_in user
    end

    def authorization_params(client_id:, requested_redirect_uri:)
      {
        client_id: client_id,
        redirect_uri: requested_redirect_uri,
        response_type: 'code',
        scope: 'mcp:public:read',
        state: 'oauth-redirect-test-state',
        code_challenge: code_challenge(code_verifier),
        code_challenge_method: 'S256',
        resource: resource
      }
    end

    it 'aceita o callback cadastrado no cliente' do
      get '/oauth/authorize', params: authorization_params(
        client_id: application.uid,
        requested_redirect_uri: redirect_uri
      )

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(application.name)
    end

    it 'retoma a autorização OAuth pendente após o login Devise' do
      sign_out user
      requested_params = authorization_params(
        client_id: application.uid,
        requested_redirect_uri: redirect_uri
      )

      get '/oauth/authorize', params: requested_params

      expect(response).to redirect_to(new_user_session_url)
      expect(session['user_return_to']).to be_present

      post user_session_path, params: {
        user: { email: user.email, password: 'Password123' }
      }

      expect(response).to be_redirect
      destination = URI(response.location)
      expect(destination.path).to eq('/oauth/authorize')
      expect(Rack::Utils.parse_nested_query(destination.query)).to include(
        'client_id' => application.uid,
        'redirect_uri' => redirect_uri,
        'state' => 'oauth-redirect-test-state'
      )

      get destination.request_uri

      expect(response).to have_http_status(:ok)
      expect(response.body).to include(application.name)
    end

    it 'recusa callback diferente do cadastrado sem redirecionar para ele' do
      get '/oauth/authorize', params: authorization_params(
        client_id: application.uid,
        requested_redirect_uri: 'https://attacker.example.test/callback'
      )

      expect(response).to have_http_status(:bad_request)
      expect(response).not_to be_redirect
      expect(response.headers['Location']).to be_nil
    end

    it 'recusa client_id não cadastrado sem redirecionar ao callback informado' do
      get '/oauth/authorize', params: authorization_params(
        client_id: 'cliente-nao-cadastrado',
        requested_redirect_uri: redirect_uri
      )

      expect(response.status).to be_between(400, 499)
      expect(response).not_to be_redirect
      expect(response.headers['Location']).to be_nil
    end
  end
end
