# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::CompanyDashboardController Analytics API', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user) }

  before do
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:authenticate_company_user_or_admin!).and_return(true)
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:set_company) do |controller|
      controller.instance_variable_set(:@company, company)
    end
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:authorize_dashboard_access!).and_return(true)
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:current_user).and_return(user)
    allow_any_instance_of(Api::V1::CompanyDashboardController).to receive(:authorize).and_return(true)
    allow(company).to receive(:has_paid_plan?).and_return(true)
    allow(FeatureGateService).to receive(:can_access?).and_return(true)
  end

  describe 'GET /api/v1/company_dashboard/analytics/overview' do
    it 'retorna cta_breakdown correto com quote=1, total=1, other=0 para 1 evento quote' do
      day = Date.current
      CompanyDailyStat.create!(
        company_id: company.id,
        day: day,
        profile_views: 10,
        cta_clicks: 1,
        whatsapp_clicks: 0,
        email_clicks: 0,
        phone_clicks: 0,
        website_clicks: 0,
        quote_clicks: 1,
        leads: 0
      )

      get '/api/v1/company_dashboard/analytics/overview', params: { from: day.to_s, to: day.to_s }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['cta_breakdown']).to be_present
      expect(json['cta_breakdown']['quote']).to eq(1)
      expect(json['cta_breakdown']['total']).to eq(1)
      expect(json['cta_breakdown']['other']).to eq(0)
    end

    it 'retorna cta_breakdown correto com residual legado (total=112, quote=17, other=95)' do
      from_d = 90.days.ago.to_date
      to_d = Date.current

      CompanyDailyStat.create!(
        company_id: company.id,
        day: 5.days.ago.to_date,
        profile_views: 100,
        cta_clicks: 112,
        whatsapp_clicks: 0,
        email_clicks: 0,
        phone_clicks: 0,
        website_clicks: 0,
        quote_clicks: 17,
        leads: 0
      )

      get '/api/v1/company_dashboard/analytics/overview', params: { from: from_d.to_s, to: to_d.to_s }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)

      expect(json['cta_breakdown']).to be_present
      expect(json['cta_breakdown']['quote']).to eq(17)
      expect(json['cta_breakdown']['total']).to eq(112)
      expect(json['cta_breakdown']['other']).to eq(95)
    end
  end
end
