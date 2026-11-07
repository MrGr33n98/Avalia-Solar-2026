# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/banners — company-access sidebar', type: :request do
  it 'delivers the existing sidebar campaign through explicit fallback placements' do
    campaign = create(:banner, :approved, active: true, sponsored: false,
                      position: 'company_profile_sidebar_sponsored',
                      width: 300, height: 600)

    get '/api/v1/banners', params: {
      position: 'company_access_sidebar',
      fallback_positions: ['company_profile_sidebar_sponsored'],
      state: 'SC',
      limit: 1
    }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.map { |banner| banner.fetch('id') }).to eq([campaign.id])
    expect(response.parsed_body.first.fetch('position')).to eq('company_profile_sidebar_sponsored')
  end

  it 'reports no eligible campaign separately from a successful ad delivery' do
    allow(Banners::Metrics).to receive(:delivery)

    get '/api/v1/banners', params: { position: 'company_access_sidebar', limit: 1 }

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body).to eq([])
    expect(Banners::Metrics).to have_received(:delivery).with(
      status: 'empty', position: 'company_access_sidebar', source: 'cache_or_db'
    )
  end
end
