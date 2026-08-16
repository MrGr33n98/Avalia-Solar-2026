require 'rails_helper'

RSpec.describe 'Company Access API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:default_category) { create(:category, status: 'active') }
  let(:company) { create_active_company }
  let(:company_user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }
  let(:review_user) do
    create(:user, role: 'review', status: :active, company: nil, city: 'Sao Paulo', state: 'SP',
                  confirmed_at: Time.current)
  end

  def auth_headers(user)
    post '/api/v1/auth/login',
         params: { email: user.email, password: 'Password123' }.to_json,
         headers: headers
    token = JSON.parse(response.body)['token']
    headers.merge('Authorization' => "Bearer #{token}")
  end

  def create_active_company(attributes = {})
    category = attributes.delete(:category) || default_category

    create(
      :company,
      {
        status: 'active',
        moderation_status: 'approved',
        state: 'SP',
        city: 'Sao Paulo',
        phone: '11999999999',
        categories: [category]
      }.merge(attributes)
    )
  end

  describe 'POST /api/v1/company_access_requests' do
    it 'returns 401 without authentication' do
      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: headers

      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates a pending request for review users' do
      auth = auth_headers(review_user)
      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: auth

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['request']['status']).to eq('pending')
    end

    it 'creates a pending request for company users' do
      auth = auth_headers(company_user)
      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: auth

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['request']['status']).to eq('pending')
    end

    it 'returns 409 when a request already exists' do
      create(:company_access_request, user: company_user, company: company, status: 'pending')
      auth = auth_headers(company_user)

      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: auth

      expect(response).to have_http_status(:conflict)
    end
  end

  describe 'GET /api/v1/company_access/context' do
    it 'returns the minimum company selection contract without exposing cnpj' do
      create_active_company(name: 'Empresa Contexto', cnpj: '11222333000181', logo: nil, rating_avg: nil)
      auth = auth_headers(review_user)
      get '/api/v1/company_access/context', headers: auth

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['active_memberships']).to be_an(Array)
      expect(body['pending_requests']).to be_an(Array)
      expect(body['suggested_companies']).to be_an(Array)
      expect(body['suggested_companies'].first).to include(
        'company_id', 'company_name', 'verified', 'logo_url', 'rating'
      )
      expect(body['suggested_companies'].first['logo_url']).to be_nil
      expect(body['suggested_companies'].first['rating']).to be_nil
      expect(body['suggested_companies'].first).not_to have_key('cnpj')
    end

    it 'returns active memberships and pending requests' do
      create(:company_member, user: company_user, company: company, status: 'active')
      create(:company_access_request,
             user: company_user,
             company: create_active_company(name: 'Empresa Pendente'),
             status: 'pending')

      auth = auth_headers(company_user)
      get '/api/v1/company_access/context', headers: auth

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['active_memberships']).to be_an(Array)
      expect(body['pending_requests']).to be_an(Array)
      expect(body['active_memberships'].first['company_id']).to eq(company.id)
    end

    it 'filters suggested companies by partial name query' do
      create_active_company(name: 'Solar Master')
      create_active_company(name: 'Eolica Forte')

      auth = auth_headers(company_user)
      get '/api/v1/company_access/context', params: { q: 'solar', limit: 10 }, headers: auth

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      names = body['suggested_companies'].map { |item| item['company_name'] }
      expect(names).to include('Solar Master')
      expect(names).not_to include('Eolica Forte')
      expect(body['query']).to eq('solar')
      expect(body['limit']).to eq(10)
    end
  end
end
