# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'CompanyDashboard hero carousel API', type: :request do
  let(:company) { create(:company, status: :active) }
  let(:other_company) { create(:company, status: :active) }
  let(:user) { create(:user, status: :active, role: :company) }
  let(:token) do
    JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i,
        iat: Time.current.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base, 'HS256'
    )
  end
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    create(:company_member, company: company, user: user, role: :owner, status: :active)
    allow(ENV).to receive(:[]).and_call_original
    allow(ENV).to receive(:[]).with('BRAND_HERO_CAROUSEL_ENABLED').and_return(nil)
  end

  it 'returns only an inactive gated read model before launch' do
    get '/api/v1/company_dashboard/hero_slides',
        params: { company_id: company.id }, headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to include('enabled' => false, 'limit' => 0, 'slides' => [])
  end

  it 'does not authorize uploading via a disabled feature' do
    post '/api/v1/company_dashboard/hero_slides',
         params: { company_id: company.id, slot: 1 },
         headers: headers
    expect(response).to have_http_status(:forbidden)
  end

  it 'rejects explicit cross-tenant IDs rather than falling back to a different company' do
    get '/api/v1/company_dashboard/hero_slides',
        params: { company_id: other_company.id }, headers: headers
    expect(response).to have_http_status(:not_found)
  end

  it 'does not expose private draft URLs publicly even if a record exists' do
    company.company_hero_slides.create!(
      slot: 1, display_position: 1, revision: 1,
      alt_text: 'Rascunho', status: 'draft'
    )

    get "/api/v1/companies/#{company.id}"
    expect(response).to have_http_status(:ok)
    json = JSON.parse(response.body)
    carousel = json.dig('company', 'hero_carousel')
    expect(carousel).to include('enabled' => false, 'slides' => [])
  end
end
