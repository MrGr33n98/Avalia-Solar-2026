require 'rails_helper'

RSpec.describe 'Api::V1::CompanyDashboardBanners', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.credentials.secret_key_base) }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'GET /api/v1/company_dashboard/banners' do
    context 'when user is authenticated and authorized' do
      before do
        allow_any_instance_of(Api::V1::BaseController).to receive(:authorize_feature!).and_return(true)
        allow_any_instance_of(Api::V1::BaseController).to receive(:current_company).and_return(company)
      end

      it 'returns a consolidated dashboard payload' do
        banner = create(:banner, company: company, active: true, moderation_status: 'approved')
        create(:banner_daily_stat, banner: banner, views_count: 100, clicks_count: 10, leads_count: 1, cost_cents: 1000)

        get '/api/v1/company_dashboard/banners', headers: headers

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json).to have_key('quota')
        expect(json).to have_key('summary')
        expect(json).to have_key('banners')

        expect(json['summary']['impressions']).to eq(100)
        expect(json['summary']['clicks']).to eq(10)
        
        expect(json['banners'].first['id']).to eq(banner.id)
        expect(json['banners'].first['operational_status']).to eq('active')
        expect(json['banners'].first['allowed_actions']).to include('pause', 'edit', 'buy_addon')
      end
      end
      
      context 'regression: with a realistic Plan that does not respond to max_banners' do
        let(:plan) { create(:plan, name: 'Pro', price: 100) }
        let(:company) { create(:company, plan: plan) }

        before do
          # Stub feature_access to pretend promo_banner is enabled
          allow_any_instance_of(Company).to receive(:feature_access).and_return({ 'promo_banner' => { 'state' => 'enabled' } })
          allow_any_instance_of(Company).to receive(:feature_value_from_plan).and_return(nil)
          allow_any_instance_of(Company).to receive(:inferred_plan_tier).and_return('pro')
        end

        it 'returns 200 OK without NoMethodError' do
          get '/api/v1/company_dashboard/banners', headers: headers
          expect(response).to have_http_status(:ok)
          
          json = JSON.parse(response.body)
          expect(json['quota']['limit']).to eq(3) # Fallback limit for pro
        end
      end
    end
  end

  describe 'GET /api/v1/company_dashboard/banners/:id/performance' do
    let(:banner) { create(:banner, company: company) }
    
    before do
      allow_any_instance_of(Api::V1::BaseController).to receive(:authorize_feature!).and_return(true)
      allow_any_instance_of(Api::V1::BaseController).to receive(:current_company).and_return(company)
      
      allow(BannerAnalytics::PerformanceService).to receive(:call).and_return(
        { metrics: { impressions: 50, clicks: 5, ctr: 10, leads: 0, investment: 10, cpc: 2 }, time_series: [] }
      )
    end

    it 'returns performance data' do
      get "/api/v1/company_dashboard/banners/#{banner.id}/performance", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['metrics']['impressions']).to eq(50)
    end
  end
end
