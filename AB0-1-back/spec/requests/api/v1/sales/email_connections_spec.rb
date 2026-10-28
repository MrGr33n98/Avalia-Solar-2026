# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'CRM Zoho email connections (phase 1)', type: :request do
  let(:company) do
    Company.new(name: 'Empresa Teste Zoho', slug: 'empresa-teste-zoho').tap { |c| c.save!(validate: false) }
  end
  let(:user) do
    User.new(
      name: 'CRM User', email: 'crm.zoho.test@avaliasolar.com.br',
      password: 'Password123!', role: 'admin', company_id: company.id,
      terms_accepted: true
    ).tap { |u| u.save!(validate: false) }
  end
  let(:headers) do
    token = JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i }, Rails.application.secret_key_base)
    { 'Authorization' => "Bearer #{token}", 'CONTENT_TYPE' => 'application/json', 'Accept' => 'application/json' }
  end

  it 'rejects unauthenticated account listing' do
    get '/api/v1/sales/email_connections'
    expect(response).not_to have_http_status(:ok)
  end

  it 'returns only the current user accounts without OAuth credentials' do
    Sales::EmailAccount.create!(
      user_id: user.id, company_id: company.id, provider: 'zoho',
      email: 'commercial@example.test',
      access_token_encrypted: 'encrypted-test-token', refresh_token_encrypted: 'encrypted-test-refresh'
    )
    get '/api/v1/sales/email_connections', headers: headers
    expect(response).to have_http_status(:ok)
    data = JSON.parse(response.body)
    expect(data['accounts'].first['email']).to eq('commercial@example.test')
    expect(response.body).not_to include('encrypted-test-token', 'encrypted-test-refresh')
  end

  it 'fails closed when provider OAuth credentials are not configured' do
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('ZOHO_MAIL_CLIENT_ID').and_return(nil)
    post '/api/v1/sales/email_connections/zoho/authorize', headers: headers
    expect(response).to have_http_status(:service_unavailable)
  end

  it 'rejects missing OAuth state without creating an account' do
    expect {
      get '/api/v1/sales/email_connections/zoho/callback', params: { code: 'test-code' }
    }.not_to change(Sales::EmailAccount, :count)
    expect(response).to have_http_status(:redirect)
    expect(response.location).to include('connection=invalid_state')
  end

  it 'rejects a forged OAuth state without creating an account' do
    expect {
      get '/api/v1/sales/email_connections/zoho/callback', params: { state: 'forged-state', code: 'test-code' }
    }.not_to change(Sales::EmailAccount, :count)
    expect(response.location).to include('connection=invalid_state')
  end
end
