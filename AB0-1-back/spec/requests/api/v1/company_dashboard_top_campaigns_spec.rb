# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Company dashboard top campaigns', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, role: 'company', status: :active, company: company) }
  let(:relation) { instance_double(ActiveRecord::Relation) }
  let(:campaign_record) do
    instance_double(
      CompanyUtmAttribution,
      id: 42,
      utm_campaign: 'solar-q1',
      utm_source: 'google',
      utm_medium: 'cpc',
      total_visits: 120,
      total_cta_clicks: 24,
      total_leads: 8,
      conversion_rate: BigDecimal('6.67'),
      last_seen_at: Date.new(2026, 3, 11)
    )
  end

  before do
    create(:company_member, company: company, user: user, role: :owner, status: 'active')
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)

    allow(CompanyUtmAttribution).to receive(:where).with(company_id: company.id).and_return(relation)
    allow(relation).to receive(:recent).and_return(relation)
    allow(relation).to receive(:by_leads).and_return(relation)
    allow(relation).to receive(:limit).with(3).and_return([campaign_record])
  end

  it 'returns the expected top campaigns payload' do
    get '/api/v1/company_dashboard/analytics/top_campaigns', params: { company_id: company.id, limit: 3 }

    expect(response).to have_http_status(:ok)

    body = JSON.parse(response.body)
    expect(body['campaigns']).to eq([
      {
        'id' => 42,
        'utm_campaign' => 'solar-q1',
        'utm_source' => 'google',
        'utm_medium' => 'cpc',
        'total_visits' => 120,
        'total_cta_clicks' => 24,
        'total_leads' => 8,
        'conversion_rate' => 6.67,
        'last_seen_at' => '2026-03-11'
      }
    ])
  end
end
