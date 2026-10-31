# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Accounts', type: :request do
  let(:tenant_company) { create(:company, name: 'Tenant Solar S/A') }
  let(:other_company) { create(:company, name: 'Other Org') }
  let(:sales_user) { create(:user, company: tenant_company, role: :company) }
  let(:other_user) { create(:user, company: other_company, role: :company) }

  let!(:account) do
    Sales::Account.create!(
      company: tenant_company,
      owner: sales_user,
      name: 'Alpha Solar Integrador',
      domain: 'alphasolar.com.br',
      city: 'Florianópolis',
      state: 'SC',
      segment: 'Integrador / Instalador',
      phone: '48999990000',
      email: 'contato@alphasolar.com.br'
    )
  end

  let!(:outside_account) do
    Sales::Account.create!(
      company: other_company,
      owner: other_user,
      name: 'Beta Solar de Outro Tenant',
      domain: 'betasolar.com.br',
      city: 'Curitiba',
      state: 'PR'
    )
  end

  def headers_for(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.credentials.secret_key_base || 'secret',
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' }
  end

  describe 'GET /api/v1/sales/accounts' do
    it 'returns accounts scoped to tenant without fabricated metrics' do
      get '/api/v1/sales/accounts', headers: headers_for(sales_user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['accounts']).to be_an(Array)
      account_ids = json['accounts'].map { |a| a['id'] }
      expect(account_ids).to include(account.id)
      expect(account_ids).not_to include(outside_account.id)

      record = json['accounts'].find { |a| a['id'] == account.id }
      # Should not have fabricated +1 or * 0.7 when 0 activities/emails exist
      expect(record['emails_sent_count']).to eq(0)
      expect(record['emails_opened_count']).to eq(0)
      expect(record['fit_score']).to be_a(Integer)
      expect(record['data_quality']).to be_a(Integer)
    end

    it 'filters correctly by tag using sales_tag_id' do
      tag = Sales::Tag.create!(name: 'Cliente VIP', company: tenant_company)
      Sales::Tagging.create!(taggable: account, tag: tag, created_by: sales_user)

      get "/api/v1/sales/accounts?tag_ids[]=#{tag.id}", headers: headers_for(sales_user)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['accounts'].map { |a| a['id'] }).to eq([account.id])
    end
  end

  describe 'GET /api/v1/sales/accounts/:id' do
    it 'returns detailed account data and handles marketplace link distinction' do
      get "/api/v1/sales/accounts/#{account.id}", headers: headers_for(sales_user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      acc_data = json['account']
      expect(acc_data['id']).to eq(account.id)
      expect(acc_data['name']).to eq('Alpha Solar Integrador')
      expect(acc_data['fit_score']).to be_present
      expect(acc_data['data_quality']).to be_present
      expect(acc_data['next_best_action']).to be_present
      expect(acc_data['summary']).to be_present
    end

    it 'blocks cross-tenant access with 404' do
      get "/api/v1/sales/accounts/#{outside_account.id}", headers: headers_for(sales_user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/sales/accounts/:id/timeline' do
    it 'returns unified timeline events including activities and notes' do
      account.activities.create!(
        actor: sales_user,
        activity_type: 'call',
        subject: 'Ligação de apresentação',
        body: 'Falamos com o diretor comercial'
      )
      Sales::Note.create!(
        account: account,
        author: sales_user,
        title: 'Alinhamento estratégico',
        body: 'Pretende fechar no próximo trimestre'
      )

      get "/api/v1/sales/accounts/#{account.id}/timeline", headers: headers_for(sales_user)

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      timeline = json['timeline']
      expect(timeline).to be_an(Array)
      kinds = timeline.map { |e| e['kind'] }
      expect(kinds).to include('call')
      expect(kinds).to include('note')
      expect(kinds).to include('website') # creation event
    end
  end
end
