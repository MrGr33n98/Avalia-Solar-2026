# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::TenantIsolationRead', type: :request do
  let(:company_a) { create(:company) }
  let(:company_b) { create(:company) }

  let(:user_a) { create(:user, company: company_a, role: :company) }
  let(:user_b) { create(:user, company: company_b, role: :company) }

  let(:sales_role) do
    Sales::Role.create!(
      name: "Rep Vendas #{SecureRandom.hex(4)}",
      slug: "rep_vendas_#{SecureRandom.hex(4)}",
      system: true
    )
  end

  before do
    Sales::UserRole.create!(user: user_a, role: sales_role)
    Sales::UserRole.create!(user: user_b, role: sales_role)
  end

  let!(:account_a) { Sales::Account.create!(company: company_a, owner: user_a, name: 'Empresa Tenant A') }
  let!(:account_b) { Sales::Account.create!(company: company_b, owner: user_b, name: 'Empresa Tenant B') }

  let!(:contact_a) { Sales::Contact.create!(sales_account_id: account_a.id, first_name: 'Contact A', user: user_a) }
  let!(:contact_b) { Sales::Contact.create!(sales_account_id: account_b.id, first_name: 'Contact B', user: user_b) }

  let(:pipeline) do
    Sales::Pipeline.create!(name: 'Pipeline Standard', key: "pip_#{SecureRandom.hex(4)}", active: true)
  end
  let!(:stage) { pipeline.stages.create!(name: 'Novo', key: 'novo', position: 1, probability: 10) }

  let!(:opportunity_a) do
    Sales::Opportunity.create!(sales_account_id: account_a.id, primary_contact_id: contact_a.id, owner: user_a, pipeline: pipeline, stage: stage, name: 'Opp A')
  end
  let!(:opportunity_b) do
    Sales::Opportunity.create!(sales_account_id: account_b.id, primary_contact_id: contact_b.id, owner: user_b, pipeline: pipeline, stage: stage, name: 'Opp B')
  end

  let!(:task_a) do
    Sales::Task.create!(sales_account_id: account_a.id, sales_contact_id: contact_a.id, sales_opportunity_id: opportunity_a.id,
                        owner: user_a, task_type: 'call', title: 'Tarefa Tenant A', due_at: Time.current)
  end
  let!(:task_b) do
    Sales::Task.create!(sales_account_id: account_b.id, sales_contact_id: contact_b.id, sales_opportunity_id: opportunity_b.id,
                        owner: user_b, task_type: 'call', title: 'Tarefa Tenant B', due_at: Time.current)
  end

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  describe 'GET /api/v1/sales/accounts' do
    it 'returns only accounts belonging to user tenant' do
      get '/api/v1/sales/accounts', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body)['accounts'].map { |acc| acc['id'] }
      expect(ids).to include(account_a.id)
      expect(ids).not_to include(account_b.id)
    end
  end

  describe 'GET /api/v1/sales/contacts' do
    it 'returns only contacts belonging to user tenant' do
      get '/api/v1/sales/contacts', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body)['contacts'].map { |c| c['id'] }
      expect(ids).to include(contact_a.id)
      expect(ids).not_to include(contact_b.id)
    end

    it 'returns 404 when querying contact from another tenant directly' do
      get "/api/v1/sales/contacts/#{contact_b.id}", headers: auth_headers(user_a)
      expect(response).to have_http_status(:not_found)
      hidden_response = response.body
      get '/api/v1/sales/contacts/999999999', headers: auth_headers(user_a)
      expect(response).to have_http_status(:not_found)
      expect(response.body).to eq(hidden_response)
    end
  end

  describe 'GET /api/v1/sales/opportunities' do
    it 'returns only opportunities belonging to user tenant' do
      get '/api/v1/sales/opportunities', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body)['opportunities'].map { |o| o['id'] }
      expect(ids).to include(opportunity_a.id)
      expect(ids).not_to include(opportunity_b.id)
    end
  end

  describe 'GET /api/v1/sales/search' do
    it 'filters out cross-tenant records from search results' do
      get "/api/v1/sales/search?q=Empresa", headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      results = JSON.parse(response.body)['results']
      titles = results.map { |r| r['title'] }
      expect(titles).to include('Empresa Tenant A')
      expect(titles).not_to include('Empresa Tenant B')
    end
  end

  describe 'GET /api/v1/sales/today' do
    it 'uses the same tenant universe for every list in the daily queue' do
      get '/api/v1/sales/today', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body)
      rows = result.values.flatten
      expect(rows.map { |row| row['title'] || row['name'] }).to include('Tarefa Tenant A')
      expect(rows.map { |row| row['account_id'] }.compact).not_to include(account_b.id)
    end
  end

  describe 'GET /api/v1/sales/tasks' do
    it 'returns only the current seller tasks and matching totals' do
      get '/api/v1/sales/tasks', headers: auth_headers(user_a)
      expect(response).to have_http_status(:ok)
      result = JSON.parse(response.body)['tasks']
      expect(result.map { |row| row['id'] }).to include(task_a.id)
      expect(result.map { |row| row['id'] }).not_to include(task_b.id)
    end
  end
end
