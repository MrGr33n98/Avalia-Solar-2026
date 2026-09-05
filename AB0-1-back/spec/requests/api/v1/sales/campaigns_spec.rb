# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Campaigns API', type: :request do
  let!(:company) { create(:company) rescue Company.create!(name: 'Empresa Teste', slug: 'empresa-teste-campaigns') }
  let!(:user) { create(:user, company: company) rescue User.create!(name: 'User Campaign Test', email: "user_campaign_#{SecureRandom.hex(4)}@test.com", password: 'Password123!', company_id: company.id) }
  let!(:account) { ::Sales::Account.create!(name: 'Integradora Solar RS', company: company, owner: user, segment: 'Integrador', state: 'RS', city: 'Porto Alegre') }
  let!(:contact) { ::Sales::Contact.create!(first_name: 'Carlos', last_name: 'Silva', email: "carlos_#{SecureRandom.hex(4)}@solarrs.com", sales_account_id: account.id, company_id: company.id) }
  let!(:template) { ::Sales::EmailTemplate.create!(name: 'Template Promocional', subject_template: 'Oferta Especial Solar', body_html: '<p>Olá {{first_name}}</p>', company_id: company.id) }

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

  describe 'POST /api/v1/sales/audiences/preview' do
    it 'previews audience counts based on filters' do
      post '/api/v1/sales/audiences/preview', params: {
        audience_filter: { state: 'RS' }
      }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['total_count']).to be >= 1
      expect(json['sample_contacts'].first['email']).to eq(contact.email)
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

      # 1. Snapshot
      post "/api/v1/sales/campaigns/#{campaign.id}/snapshot"
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.total_recipients).to eq(1)

      # 2. Dispatch
      post "/api/v1/sales/campaigns/#{campaign.id}/dispatch"
      expect(response).to have_http_status(:ok)
      campaign.reload
      expect(campaign.status).to eq('dispatching').or eq('completed')

      # 3. Analytics
      get "/api/v1/sales/campaigns/#{campaign.id}/analytics"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['metrics']['total_recipients']).to be >= 1
    end
  end
end
