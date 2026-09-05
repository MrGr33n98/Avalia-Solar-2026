# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Campaigns API', type: :request do
  let!(:company) { create(:company) rescue Company.create!(name: 'Empresa Teste A', slug: 'empresa-teste-a') }
  let!(:other_company) { create(:company) rescue Company.create!(name: 'Empresa Teste B', slug: 'empresa-teste-b') }

  let!(:user) { create(:user, company: company) rescue User.create!(name: 'User Test A', email: "user_a_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id) }
  let!(:other_user) { create(:user, company: other_company) rescue User.create!(name: 'User Test B', email: "user_b_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: other_company.id) }

  let!(:account) { ::Sales::Account.create!(name: 'Integradora Solar RS', company: company, owner: user, segment: 'Integrador', state: 'RS', city: 'Porto Alegre') }
  let!(:contact) { ::Sales::Contact.create!(first_name: 'Carlos', last_name: 'Silva', email: "carlos_#{SecureRandom.hex(4)}@solarrs.com", sales_account_id: account.id) }
  let!(:template) { ::Sales::EmailTemplate.create!(name: 'Template Promocional', subject_template: 'Oferta Especial Solar', body_html: '<p>Olá {{first_name}}</p>', company_id: company.id) }

  def auth_headers(u)
    token = JWT.encode({ user_id: u.id, typ: 'access', exp: 1.day.from_now.to_i }, Rails.application.secret_key_base, 'HS256')
    { 'Authorization' => "Bearer #{token}" }
  end

  describe 'REGRESSION & ROUTING CHECKS' do
    it 'ensures CampaignsController does not override ActionController#dispatch method' do
      owner = Api::V1::Sales::CampaignsController.instance_method(:dispatch).owner
      expect(owner).not_to eq(Api::V1::Sales::CampaignsController)
      expect(owner).to eq(ActionController::Metal)
    end

    it 'routes POST /api/v1/sales/campaigns/:id/dispatch to campaigns#launch' do
      route = Rails.application.routes.recognize_path('/api/v1/sales/campaigns/1/dispatch', method: :post)
      expect(route[:controller]).to eq('api/v1/sales/campaigns')
      expect(route[:action]).to eq('launch')
      expect(route[:id]).to eq('1')
    end
  end

  describe 'GET /api/v1/sales/campaigns (Contract, N+1 & Pagination Tests)' do
    it 'returns HTTP 200 with empty list and correct pagination metadata when 0 campaigns exist' do
      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaigns']).to eq([])
      expect(json['meta']).to include(
        'page' => 1,
        'per_page' => 20,
        'total_count' => 0,
        'total_pages' => 0
      )
    end

    it 'returns HTTP 200 with 1 campaign when 1 campaign exists' do
      campaign = ::Sales::Campaign.create!(
        name: 'Campanha Única 2026',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        email_template_id: template.id,
        status: 'draft'
      )

      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaigns'].size).to eq(1)
      expect(json['campaigns'].first['id']).to eq(campaign.id)
      expect(json['campaigns'].first['template_name']).to eq('Template Promocional')
      expect(json['meta']['total_count']).to eq(1)
    end

    it 'paginates correctly with 20 campaigns' do
      20.times do |n|
        ::Sales::Campaign.create!(
          name: "Campanha #{n + 1}",
          campaign_type: 'email_broadcast',
          company_id: company.id,
          user_id: user.id,
          status: 'draft'
        )
      end

      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 10 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaigns'].size).to eq(10)
      expect(json['meta']['total_count']).to eq(20)
      expect(json['meta']['total_pages']).to eq(2)
    end
  end

  describe 'TENANT ISOLATION & IDOR DEFENSE' do
    let!(:my_campaign) do
      ::Sales::Campaign.create!(
        name: 'Campanha Empresa A',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        status: 'draft'
      )
    end

    let!(:other_campaign) do
      ::Sales::Campaign.create!(
        name: 'Campanha Empresa B',
        campaign_type: 'email_broadcast',
        company_id: other_company.id,
        user_id: other_user.id,
        status: 'draft'
      )
    end

    it 'index does not leak other company campaigns' do
      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      ids = json['campaigns'].map { |c| c['id'] }
      expect(ids).to include(my_campaign.id)
      expect(ids).not_to include(other_campaign.id)
    end

    it 'show returns 404 for campaign belonging to another tenant' do
      get "/api/v1/sales/campaigns/#{other_campaign.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end

    it 'update returns 404 for campaign belonging to another tenant' do
      patch "/api/v1/sales/campaigns/#{other_campaign.id}", params: { campaign: { name: 'Tentativa Hacked' } }, headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end

    it 'destroy returns 404 for campaign belonging to another tenant' do
      delete "/api/v1/sales/campaigns/#{other_campaign.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end

    it 'launch returns 404 for campaign belonging to another tenant' do
      post "/api/v1/sales/campaigns/#{other_campaign.id}/dispatch", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'CAMPAIGN ACTIONS (Show, Create, Update, Destroy, Pause, Resume, Cancel, Retry)' do
    let!(:campaign) do
      ::Sales::Campaign.create!(
        name: 'Campanha Teste Ações',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        email_template_id: template.id,
        audience_filter: { state: 'RS' },
        status: 'draft'
      )
    end

    it 'GET /api/v1/sales/campaigns/:id (show)' do
      get "/api/v1/sales/campaigns/#{campaign.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaign']['id']).to eq(campaign.id)
      expect(json['metrics']).to include('total_recipients')
    end

    it 'POST /api/v1/sales/campaigns (create)' do
      post '/api/v1/sales/campaigns', params: {
        campaign: {
          name: 'Nova Campanha de Primavera',
          campaign_type: 'email_broadcast',
          email_template_id: template.id,
          audience_filter: { state: 'RS' }
        }
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:created).or have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaign']['name']).to eq('Nova Campanha de Primavera')
      expect(json['campaign']['status']).to eq('draft')
    end

    it 'PATCH /api/v1/sales/campaigns/:id (update)' do
      patch "/api/v1/sales/campaigns/#{campaign.id}", params: {
        campaign: { name: 'Campanha Nome Atualizado' }
      }, headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaign']['name']).to eq('Campanha Nome Atualizado')
    end

    it 'DELETE /api/v1/sales/campaigns/:id (destroy)' do
      delete "/api/v1/sales/campaigns/#{campaign.id}", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(::Sales::Campaign.exists?(campaign.id)).to be false
    end

    it 'POST /api/v1/sales/campaigns/:id/pause & resume & cancel' do
      campaign.update!(status: 'dispatching')

      post "/api/v1/sales/campaigns/#{campaign.id}/pause", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(campaign.reload.status).to eq('paused')

      post "/api/v1/sales/campaigns/#{campaign.id}/resume", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(campaign.reload.status).to eq('dispatching')

      post "/api/v1/sales/campaigns/#{campaign.id}/cancel", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(campaign.reload.status).to eq('cancelled')
    end

    it 'POST /api/v1/sales/campaigns/:id/retry_failed' do
      campaign.update!(status: 'dispatching')
      campaign.recipients.create!(
        company_id: company.id,
        email: 'falha@test.com',
        status: 'failed',
        error_message: '550 User unknown'
      )

      post "/api/v1/sales/campaigns/#{campaign.id}/retry_failed", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['dispatch']['retried_count']).to eq(1)
    end
  end

  describe 'Full Campaign Lifecycle (Snapshot -> Dispatch -> Analytics)' do
    it 'snapshots audience, dispatches batch email jobs, and calculates metrics' do
      campaign = ::Sales::Campaign.create!(
        name: 'Campanha Inbound Solar',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        email_template_id: template.id,
        audience_filter: { state: 'RS' },
        status: 'draft'
      )

      # 1. Preflight
      post "/api/v1/sales/campaigns/#{campaign.id}/preflight", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['preflight']['ready']).to be(true)

      # 2. Snapshot
      post "/api/v1/sales/campaigns/#{campaign.id}/snapshot", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.total_recipients).to eq(1)

      # 3. Dispatch
      post "/api/v1/sales/campaigns/#{campaign.id}/dispatch", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.status).to eq('dispatching').or eq('completed')

      # 4. Analytics
      get "/api/v1/sales/campaigns/#{campaign.id}/analytics", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['metrics']['total_recipients']).to be >= 1
    end
  end

  describe 'DOMAIN ERROR CONTRACT (dispatch returns 422 on preflight failure)' do
    let!(:campaign_no_template) do
      ::Sales::Campaign.create!(
        name: 'Campanha Sem Template',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        email_template_id: nil,
        audience_filter: { state: 'RS' },
        status: 'draft'
      )
    end

    it 'launch with failed preflight returns HTTP 422' do
      post "/api/v1/sales/campaigns/#{campaign_no_template.id}/dispatch", headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'payload contains error=PREFLIGHT_FAILED' do
      post "/api/v1/sales/campaigns/#{campaign_no_template.id}/dispatch", headers: auth_headers(user)
      json = JSON.parse(response.body)
      expect(json['dispatch']['error']).to eq('PREFLIGHT_FAILED')
    end

    it 'payload preserves preflight.blockers with MISSING_TEMPLATE' do
      post "/api/v1/sales/campaigns/#{campaign_no_template.id}/dispatch", headers: auth_headers(user)
      json = JSON.parse(response.body)
      blockers = json['dispatch']['preflight']['blockers']
      expect(blockers).to be_an(Array)
      codes = blockers.map { |b| b['code'] }
      expect(codes).to include('MISSING_TEMPLATE')
    end

    it 'does NOT enqueue CampaignBatchProcessorJob when preflight fails' do
      expect {
        post "/api/v1/sales/campaigns/#{campaign_no_template.id}/dispatch", headers: auth_headers(user)
      }.not_to have_enqueued_job(::Sales::CampaignBatchProcessorJob)
    end

    it 'campaign remains in draft status after failed dispatch' do
      post "/api/v1/sales/campaigns/#{campaign_no_template.id}/dispatch", headers: auth_headers(user)
      expect(campaign_no_template.reload.status).to eq('draft')
    end

    it 'preflight endpoint returns 422 when campaign has blockers' do
      post "/api/v1/sales/campaigns/#{campaign_no_template.id}/preflight", headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json['preflight']['ready']).to be(false)
    end
  end
end
