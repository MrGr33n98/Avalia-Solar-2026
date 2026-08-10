require 'rails_helper'

RSpec.describe 'Api::V1::CompanyDashboardBanners', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let!(:membership) { create(:company_member, user: user, company: company, role: 'owner', status: 'active') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'GET /api/v1/company_dashboard/banners' do
    context 'when user is authenticated and authorized' do
      before do
        allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
          .to receive(:authorize_feature!).and_return(true)
        allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
          .to receive(:current_company).and_return(company)
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
        expect(json).to have_key('operational_health')
        expect(json).to have_key('placements')
        expect(json['placements']).to include(hash_including('key' => 'compare_page_inline', 'status' => 'active'))
        expect(json['operational_health']['status']).to be_in(%w[healthy degraded stale unknown])

        expect(json['summary']['impressions']).to eq(100)
        expect(json['summary']['clicks']).to eq(10)
        
        expect(json['banners'].first['id']).to eq(banner.id)
        expect(json['banners'].first['operational_status']).to eq('active')
        expect(json['banners'].first['allowed_actions']).to include('pause', 'edit', 'buy_addon')
      end
      
      it 'marca add-on ativo como contrato saudavel no health do banner' do
        banner = create(:banner, :sponsored, company: company, active: true, moderation_status: 'approved')
        create(:banner_addon_subscription, banner: banner, company: company, status: 'active')

        get '/api/v1/company_dashboard/banners', headers: headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        health = payload['banners'].find { |item| item['id'] == banner.id }['delivery_health']
        expect(health['status']).to eq('healthy')
        expect(health['checks']).to include(hash_including('key' => 'contract', 'ok' => true))
      end

      it 'nao lista add-on expirado como ativo' do
        banner = create(:banner, :sponsored, company: company, active: true, moderation_status: 'approved')
        create(:banner_addon_subscription, banner: banner, company: company, status: 'active',
               starts_at: 10.days.ago, ends_at: 1.day.ago)

        get '/api/v1/company_dashboard/banners', headers: headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        item = payload['banners'].find { |entry| entry['id'] == banner.id }
        expect(item['active_addons']).to be_empty
      end

      it 'permite submissao de uma posicao ativa com consumidor real' do
        banner = create(:banner, company: company, position: 'comparison_floating_bar', moderation_status: 'draft')

        patch "/api/v1/company_dashboard/banners/#{banner.id}/submit", headers: headers

        expect(response).to have_http_status(:ok)
        expect(banner.reload.moderation_status).to eq('submitted')
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

  describe 'GET /api/v1/company_dashboard/banners/export_alerts' do
    before do
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:authorize_feature!).and_return(true)
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:current_company).and_return(company)
    end

    it 'retorna somente alertas do usuário autenticado e campos mínimos' do
      BannerAuditLog.create!(auditable: user, actor: user, action: 'suspicious_export_alert', source: 'banner_audit_anomaly_job', metadata_json: { 'status' => 'open', 'count' => 12, 'threshold' => 10, 'window_hours' => 24 })
      other_user = create(:user, company: company)
      BannerAuditLog.create!(auditable: other_user, actor: other_user, action: 'suspicious_export_alert', source: 'banner_audit_anomaly_job', metadata_json: { 'status' => 'open', 'count' => 20 })

      get '/api/v1/company_dashboard/banners/export_alerts', headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['alerts']).to contain_exactly(hash_including('count' => 12, 'threshold' => 10, 'status' => 'open'))
      expect(json['alerts'].first).not_to have_key('metadata_json')
    end
  end

  describe 'PATCH /api/v1/company_dashboard/banners/acknowledge_export_alert' do
    before do
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:authorize_feature!).and_return(true)
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:current_company).and_return(company)
    end

    it 'reconhece somente alerta do próprio usuário e cria trilha' do
      alert = BannerAuditLog.create!(auditable: user, actor: user, action: 'suspicious_export_alert', source: 'job', metadata_json: { 'status' => 'open', 'count' => 10 })

      patch "/api/v1/company_dashboard/banners/#{alert.id}/acknowledge_export_alert", headers: headers

      expect(response).to have_http_status(:ok)
      expect(alert.reload.metadata_json).to include('status' => 'resolved', 'resolution' => 'acknowledged_by_actor')
      expect(BannerAuditLog.where(action: 'suspicious_export_acknowledged', actor: user)).to exist
    end
  end

  describe 'POST /api/v1/company_dashboard/banners/export_audit' do
    before do
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:authorize_feature!).and_return(true)
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:current_company).and_return(company)
    end

    it 'registra ator, filtros e formato sem expor dados de evento' do
      post '/api/v1/company_dashboard/banners/export_audit',
           params: { format: 'csv', days: '3', incident_type: 'discard_rate_high', record_count: 2 },
           headers: headers

      expect(response).to have_http_status(:created)
      log = BannerAuditLog.order(:created_at).last
      expect(log.action).to eq('export_incidents')
      expect(log.actor).to eq(user)
      expect(log.auditable).to eq(company)
      expect(log.metadata_json).to include('format' => 'csv', 'days' => '3', 'record_count' => 2)
      expect(log.metadata_json).not_to have_key('events')
    end

    it 'lista histórico paginado sem expor conteúdo de eventos' do
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: { 'format' => 'json', 'record_count' => 4 })

      get '/api/v1/company_dashboard/banners/export_audits', params: { page: 1, per_page: 10 }, headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['audits'].first).to include('action' => 'export_incidents', 'format' => 'json', 'record_count' => 4)
      expect(json['audits'].first).not_to have_key('metadata_json')
      expect(json['meta']).to include('page' => 1, 'per_page' => 10, 'total' => 1)
    end

    it 'filtra por formato e nunca retorna logs de outra empresa' do
      other_company = create(:company)
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: { 'format' => 'csv', 'record_count' => 1 })
      BannerAuditLog.create!(auditable: company, actor: user, action: 'export_incidents', source: 'company_dashboard', metadata_json: { 'format' => 'json', 'record_count' => 2 })
      BannerAuditLog.create!(auditable: other_company, action: 'export_incidents', source: 'company_dashboard', metadata_json: { 'format' => 'csv', 'record_count' => 99 })

      get '/api/v1/company_dashboard/banners/export_audits', params: { format: 'csv' }, headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['meta']['total']).to eq(1)
      expect(json['audits'].map { |audit| audit['record_count'] }).to eq([1])
    end

    it 'rejeita formato de exportacao desconhecido' do
      post '/api/v1/company_dashboard/banners/export_audit',
           params: { format: 'xml' }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(BannerAuditLog.where(action: 'export_incidents')).to be_empty
    end
  end

  describe 'GET /api/v1/company_dashboard/banners/:id/performance' do
    let(:banner) { create(:banner, company: company) }
    
    before do
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:authorize_feature!).and_return(true)
      allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
        .to receive(:current_company).and_return(company)
      
      allow(BannerAnalytics::PerformanceService).to receive(:call).and_return(
        { metrics: { impressions: 50, clicks: 5, ctr: 10, leads: 0, investment: 10, cpc: 2 }, time_series: [] }
      )
    end

    it 'exports performance as csv' do
      get "/api/v1/company_dashboard/banners/#{banner.id}/export.csv", headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.media_type).to eq('text/csv')
      expect(response.body).to include('day,impressions,clicks,leads,ctr')
    end

    it 'returns invalid date range error' do
      get "/api/v1/company_dashboard/banners/#{banner.id}/export.json",
          params: { start_date: 'invalid-date' }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(JSON.parse(response.body)['error']).to eq('invalid_date_range')
    end

    it 'returns performance data' do
      get "/api/v1/company_dashboard/banners/#{banner.id}/performance", headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json['metrics']['impressions']).to eq(50)
    end
  end
end


RSpec.describe 'Banner lifecycle transitions', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let!(:membership) { create(:company_member, user: user, company: company, role: 'owner', status: 'active') }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
      .to receive(:authorize_feature!).and_return(true)
    allow_any_instance_of(Api::V1::CompanyDashboardBannersController)
      .to receive(:current_company).and_return(company)
  end

  it 'nao permite retomar banner sem aprovacao' do
    banner = create(:banner, company: company, active: false, moderation_status: 'submitted')

    patch "/api/v1/company_dashboard/banners/#{banner.id}/resume", headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['error']).to eq('banner_must_be_approved')
    expect(banner.reload.active).to be(false)
  end

  it 'nao permite submeter banner ja submetido' do
    banner = create(:banner, company: company, moderation_status: 'submitted')

    patch "/api/v1/company_dashboard/banners/#{banner.id}/submit", headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    expect(JSON.parse(response.body)['error']).to eq('invalid_moderation_transition')
  end
end
