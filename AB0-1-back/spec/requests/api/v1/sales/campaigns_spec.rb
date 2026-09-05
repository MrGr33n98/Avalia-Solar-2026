# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Campaigns API', type: :request do
  let!(:company) { create(:company) rescue Company.create!(name: 'Empresa Teste A', slug: 'empresa-teste-a') }
  let!(:other_company) { create(:company) rescue Company.create!(name: 'Empresa Teste B', slug: 'empresa-teste-b') }

  let!(:user) { create(:user, company: company) rescue User.create!(name: 'User Test A', email: "user_a_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id) }
  let!(:other_user) { create(:user, company: other_company) rescue User.create!(name: 'User Test B', email: "user_b_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: other_company.id) }

  let!(:account) { ::Sales::Account.create!(name: 'Integradora Solar RS', company: company, owner: user, segment: 'Integrador', state: 'RS', city: 'Porto Alegre') }
  let!(:contact) { ::Sales::Contact.create!(first_name: 'Carlos', last_name: 'Silva', email: "carlos_#{SecureRandom.hex(4)}@solarrs.com", sales_account_id: account.id, company_id: company.id) }
  let!(:template) { ::Sales::EmailTemplate.create!(name: 'Template Promocional', subject_template: 'Oferta Especial Solar', body_html: '<p>Olá {{first_name}}</p>', company_id: company.id) }

  describe 'GET /api/v1/sales/campaigns (Contract & Pagination Tests)' do
    it 'returns HTTP 200 with empty list and correct pagination metadata when 0 campaigns exist' do
      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }

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

      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaigns'].size).to eq(1)
      expect(json['campaigns'].first['id']).to eq(campaign.id)
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

      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 10 }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaigns'].size).to eq(10)
      expect(json['meta']['total_count']).to eq(20)
      expect(json['meta']['total_pages']).to eq(2)
    end

    it 'enforces strict tenant isolation and does not expose other company campaigns' do
      other_campaign = ::Sales::Campaign.create!(
        name: 'Campanha Empresa B',
        campaign_type: 'email_broadcast',
        company_id: other_company.id,
        user_id: other_user.id,
        status: 'draft'
      )

      my_campaign = ::Sales::Campaign.create!(
        name: 'Campanha Empresa A',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        status: 'draft'
      )

      get '/api/v1/sales/campaigns', params: { page: 1, per_page: 20 }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      ids = json['campaigns'].map { |c| c['id'] }
      expect(ids).to include(my_campaign.id)
      expect(ids).not_to include(other_campaign.id)
    end
  end

  describe 'POST /api/v1/sales/campaigns/:id/preflight' do
    it 'returns preflight blockers when template is missing' do
      campaign = ::Sales::Campaign.create!(
        name: 'Campanha sem Template',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        status: 'draft'
      )

      post "/api/v1/sales/campaigns/#{campaign.id}/preflight"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['preflight']['ready']).to be(false)
      expect(json['preflight']['blockers'].map { |b| b['code'] }).to include('MISSING_TEMPLATE')
    end

    it 'returns ready = true when all prerequisites are met' do
      campaign = ::Sales::Campaign.create!(
        name: 'Campanha Pronta',
        campaign_type: 'email_broadcast',
        company_id: company.id,
        user_id: user.id,
        email_template_id: template.id,
        audience_filter: { state: 'RS' },
        status: 'draft'
      )

      post "/api/v1/sales/campaigns/#{campaign.id}/preflight"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['preflight']['ready']).to be(true)
      expect(json['preflight']['blockers']).to be_empty
    end
  end

  describe 'POST /api/v1/sales/campaigns' do
    it 'creates a new campaign in draft status' do
      post '/api/v1/sales/campaigns', params: {
        campaign: {
          name: 'Campanha de Inverno 2026',
          campaign_type: 'email_broadcast',
          email_template_id: template.id,
          audience_filter: { state: 'RS' }
        }
      }

      expect(response).to have_http_status(:created).or have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['campaign']['name']).to eq('Campanha de Inverno 2026')
      expect(json['campaign']['status']).to eq('draft')
    end
  end

  describe 'Full Campaign Lifecycle (Snapshot -> Dispatch -> Metrics)' do
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
      post "/api/v1/sales/campaigns/#{campaign.id}/preflight"
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['preflight']['ready']).to be(true)

      # 2. Snapshot
      post "/api/v1/sales/campaigns/#{campaign.id}/snapshot"
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.total_recipients).to eq(1)

      # 3. Dispatch
      post "/api/v1/sales/campaigns/#{campaign.id}/dispatch"
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.status).to eq('dispatching').or eq('completed')

      # 4. Analytics
      get "/api/v1/sales/campaigns/#{campaign.id}/analytics"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['metrics']['total_recipients']).to be >= 1
    end
  end
end
