# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company dashboard conversion surfaces', type: :request do
  let(:company) do
    create(:company, status: 'active', moderation_status: 'approved',
           plan: create(:plan, name: "Gratuito #{SecureRandom.hex(4)}", price: 0, features: {}))
  end
  let(:user) { create(:user, role: :company, status: :active) }
  let(:token) do
    JWT.encode(
      { user_id: user.id, typ: 'access', exp: 1.hour.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base, 'HS256'
    )
  end
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:path) { '/api/v1/company_dashboard/conversion_surfaces' }

  before { create(:company_member, user: user, company: company, role: 'owner') }

  it 'is authenticated, scoped, and does not invent metrics for a Free company' do
    get path, params: { company_id: company.id, period: '30d' }, headers: headers

    expect(response).to have_http_status(:ok)
    body = JSON.parse(response.body)
    expect(body['company_id']).to eq(company.id)
    expect(body.dig('summary', 'catalog_candidates')).to eq(24)
    expect(body.dig('summary', 'active_quote_points')).to eq(0)
    expect(body.dig('summary', 'active_whatsapp_points')).to eq(0)
    expect(body.dig('summary', 'impressions')).to be_nil
    expect(body['data_status']).to eq('unavailable')
    expect(response.headers['Cache-Control']).to include('no-store')
  end

  it 'does not leak another tenant through requested company_id fallback' do
    other_company = create(:company)
    get path, params: { company_id: other_company.id }, headers: headers
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include('catalog_candidates')
  end

  it 'rejects unsupported date presets' do
    get path, params: { company_id: company.id, period: '999d' }, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it 'requires authentication' do
    get path, params: { company_id: company.id }
    expect(response).to have_http_status(:unauthorized)
  end
end
