# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales WhatsApp CRM tenant boundaries', type: :request do
  let(:tenant_a) { create(:company) }
  let(:tenant_b) { create(:company) }
  let(:admin) { create(:user, role: 'admin', company: tenant_a) }
  let(:public_user) { create(:user, role: 'company', company: tenant_a) }

  let!(:thread_a) do
    Sales::WhatsappThread.create!(
      company: tenant_a, provider: 'waha',
      provider_session: 'official', contact_hash: 'a' * 64
    )
  end
  let!(:thread_b) do
    Sales::WhatsappThread.create!(
      company: tenant_b, provider: 'waha',
      provider_session: 'official', contact_hash: 'b' * 64
    )
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i,
        jti: SecureRandom.uuid },
      Rails.application.secret_key_base, 'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  it 'does not expose WhatsApp CRM data without authentication' do
    get '/api/v1/sales/whatsapp_threads'
    expect(response).to have_http_status(:unauthorized)
  end

  it 'denies marketplace-only users access to the internal CRM' do
    get '/api/v1/sales/whatsapp_threads', headers: auth_headers(public_user)
    expect(response).to have_http_status(:forbidden)
  end

  it 'never returns a different company tenant thread in the list' do
    get '/api/v1/sales/whatsapp_threads', headers: auth_headers(admin)
    expect(response).to have_http_status(:ok)
    ids = JSON.parse(response.body).fetch('threads').map { |t| t.fetch('id') }
    expect(ids).to include(thread_a.id)
    expect(ids).not_to include(thread_b.id)
  end

  it 'rejects direct access to a different tenant thread' do
    get "/api/v1/sales/whatsapp_threads/#{thread_b.id}", headers: auth_headers(admin)
    expect(response).to have_http_status(:not_found)
  end
end
