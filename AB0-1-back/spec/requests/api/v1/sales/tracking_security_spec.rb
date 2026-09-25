# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales tracking security', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }
  let(:user_a) { create_sales_user(company_a) }
  let(:user_b) { create_sales_user(company_b) }
  let!(:account_a) { Sales::Account.create!(company: company_a, owner: user_a, name: 'Conta A') }
  let!(:account_b) { Sales::Account.create!(company: company_b, owner: user_b, name: 'Conta B') }

  def create_sales_user(company)
    user = create(:user, company: company, role: :company)
    role = Sales::Role.find_or_create_by!(slug: "tracking_sales_#{company.id}") do |record|
      record.name = 'Sales Tracking'
      record.system = true
    end
    Sales::UserRole.find_or_create_by!(user: user, role: role)
    user
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  it 'não aceita criação de sessão pública sem autenticação' do
    post '/api/v1/sales/tracking_sessions', params: { session: { account_id: account_b.id } }

    expect(response).to have_http_status(:unauthorized)
  end

  it 'gera identificador da sessão no servidor e aceita apenas conta do tenant' do
    post '/api/v1/sales/tracking_sessions',
         params: { session: { session_id: 'id-controlado', account_id: account_a.id } },
         headers: auth_headers(user_a)

    expect(response).to have_http_status(:created)
    expect(JSON.parse(response.body).fetch('session_id')).not_to eq('id-controlado')
    expect(Sales::TrackingSession.last.account_id).to eq(account_a.id)
  end

  it 'deriva relações do evento pela sessão e remove query string e chaves PII' do
    session = Sales::TrackingSession.create!(account: account_a, session_id: SecureRandom.uuid, started_at: Time.current)

    post '/api/v1/sales/tracking_events',
         params: { event: {
           session_id: session.session_id,
           account_id: account_b.id,
           contact_id: 999_999,
           event_name: 'page_view',
           path: '/landing?email= prospect@example.com',
           properties: { email: 'prospect@example.com', source: 'search' }
         } },
         headers: auth_headers(user_a)

    expect(response).to have_http_status(:accepted)
    event = Sales::TrackingEvent.last
    expect(event.account_id).to eq(account_a.id)
    expect(event.contact_id).to be_nil
    expect(event.path).to eq('/landing')
    expect(event.properties).to eq('source' => 'search')
  end

  it 'oculta sessão de outro tenant e recusa evento fora da allowlist' do
    session_b = Sales::TrackingSession.create!(account: account_b, session_id: SecureRandom.uuid, started_at: Time.current)

    post '/api/v1/sales/tracking_events',
         params: { event: { session_id: session_b.session_id, event_name: 'page_view' } },
         headers: auth_headers(user_a)
    expect(response).to have_http_status(:not_found)

    session_a = Sales::TrackingSession.create!(account: account_a, session_id: SecureRandom.uuid, started_at: Time.current)
    post '/api/v1/sales/tracking_events',
         params: { event: { session_id: session_a.session_id, event_name: 'arbitrary_event' } },
         headers: auth_headers(user_a)
    expect(response).to have_http_status(:unprocessable_entity)
  end
end
