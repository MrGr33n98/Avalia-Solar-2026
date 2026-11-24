# frozen_string_literal: true

require 'rails_helper'
require 'base64'
require 'digest'
require 'omniauth'

RSpec.describe 'Users OmniAuth callbacks with Doorkeeper OAuth flow', type: :request do
  let(:redirect_uri) { 'https://chatgpt.com/connector/oauth/test-callback' }
  let(:oauth_app) do
    Doorkeeper::Application.create!(
      name: 'ChatGPT Test Client',
      redirect_uri: redirect_uri,
      scopes: 'mcp:public:read',
      confidential: false,
      secret: nil
    )
  end
  let(:verifier) { "verifier-#{'o' * 40}" }
  let(:challenge) { Base64.urlsafe_encode64(Digest::SHA256.digest(verifier), padding: false) }
  let!(:user) do
    create(
      :user,
      :confirmed,
      role: :review,
      company: nil,
      email: 'google-oauth-mcp@example.test',
      provider: 'google_oauth2',
      uid: 'google-uid-mcp-123',
      status: :active
    )
  end

  around do |example|
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new(
      provider: 'google_oauth2',
      uid: user.uid,
      info: {
        email: user.email,
        name: user.name
      }
    )
    example.run
  ensure
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    OmniAuth.config.test_mode = false
  end

  it 'signs into Devise, returns to /oauth/authorize, and issues an OAuth code' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('MCP_REMOTE_OAUTH_ENABLED').and_return('true')
    allow(ENV).to receive(:[]).with('MCP_OAUTH_RESOURCE').and_return('https://api.example.test/mcp')

    authorize_params = {
      client_id: oauth_app.uid,
      redirect_uri: redirect_uri,
      response_type: 'code',
      scope: 'mcp:public:read',
      state: 'oauth-state-123',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      resource: 'https://api.example.test/mcp'
    }

    get '/oauth/authorize', params: authorize_params
    expect(response).to redirect_to(new_user_session_path)

    get '/users/auth/google_oauth2/callback'
    expect(response).to have_http_status(:found)
    expect(response.location).to include('/oauth/authorize')
    expect(response.location).to include("client_id=#{oauth_app.uid}")

    follow_redirect!
    expect(response).to have_http_status(:ok)

    form = Nokogiri::HTML(response.body).at_css('form[method="post"]')
    expect(form).to be_present
    form_params = form.css('input[type="hidden"]').to_h { |input| [input['name'], input['value']] }
    post '/oauth/authorize', params: form_params

    expect(response).to have_http_status(:found)
    expect(response.location).to start_with("#{redirect_uri}?code=")
  end

  it 'preserves frontend callback redirect for normal web Google logins' do
    allow(ENV).to receive(:fetch).and_call_original
    allow(ENV).to receive(:fetch).with('FRONTEND_ORIGIN', anything).and_return('https://www.avaliasolar.com.br')

    get '/users/auth/google_oauth2/callback'
    expect(response).to redirect_to('https://www.avaliasolar.com.br/auth/callback?status=success')
  end
end
