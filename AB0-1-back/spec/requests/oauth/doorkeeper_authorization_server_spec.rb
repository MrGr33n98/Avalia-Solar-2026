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
      created_at: created_at
    )
  end

  def exchange(grant, verifier: code_verifier)
    post '/oauth/token', params: {
      grant_type: 'authorization_code',
      client_id: application.uid,
      code: grant.plaintext_token,
      redirect_uri: redirect_uri,
      code_verifier: verifier
    }
  end

  def refresh(refresh_token)
    post '/oauth/token', params: {
      grant_type: 'refresh_token',
      client_id: application.uid,
      refresh_token: refresh_token
    }
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
end
