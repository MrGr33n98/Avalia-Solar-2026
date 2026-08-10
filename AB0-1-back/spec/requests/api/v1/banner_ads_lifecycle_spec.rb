# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Banner Ads lifecycle', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let!(:membership) { create(:company_member, user: user, company: company, role: 'owner', status: 'active') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:offer) { create(:banner_offer) }
  let!(:subscription) { create(:banner_subscription, :active, company: company, banner_offer: offer) }
  let!(:banner) do
    create(:banner, :approved, :sponsored, active: true, company: company, position: 'compare_hero',
           link: 'https://example.com/campaign')
  end

  before do
    allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
      .to receive(:authorize_feature!).and_return(true)
    allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
      .to receive(:current_company).and_return(company)
  end

  it 'delivers, tracks, reports and exports one sponsored campaign' do
    get '/api/v1/banners', params: { position: 'compare_hero' }
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).map { |row| row['id'] }).to include(banner.id)

    post '/api/v1/banner_events', params: {
      banner_event: {
        banner_id: banner.id,
        event_type: 'impression',
        impression_instance_id: 'e2e-impression-1',
        metadata: { position: 'compare_hero', page_path: '/compare' }
      }
    }
    expect(response).to have_http_status(:created)

    get "/api/v1/banner_clicks/#{banner.id}"
    expect(response).to redirect_to('https://example.com/campaign')

    get "/api/v1/company_dashboard/banners/#{banner.id}/performance", headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to include('metrics', 'breakdown', 'quality')

    get "/api/v1/company_dashboard/banners/#{banner.id}/export.csv", headers: headers
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq('text/csv')
  end
end
