require 'rails_helper'

RSpec.describe 'Company Access API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:company) { create(:company, status: 'active', moderation_status: 'approved') }
  let(:company_user) { create(:user, role: 'company', status: :active, company: nil, confirmed_at: Time.current) }
  let(:review_user) { create(:user, role: 'review', status: :active, company: nil, city: 'Sao Paulo', state: 'SP', confirmed_at: Time.current) }

  def auth_headers(user)
    post '/api/v1/auth/login',
         params: { email: user.email, password: 'Password123' }.to_json,
         headers: headers
    token = JSON.parse(response.body)['token']
    headers.merge('Authorization' => "Bearer #{token}")
  end

  describe 'POST /api/v1/company_access_requests' do
    it 'returns 401 without authentication' do
      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: headers

      expect(response).to have_http_status(:unauthorized)
    end

    it 'returns 403 for review users' do
      auth = auth_headers(review_user)
      post '/api/v1/company_access_requests',
           params: { company_id: company.id }.to_json,
           headers: auth

      expect(response).to have_http_status(:forbidden)
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
    it 'returns 403 for review users' do
      auth = auth_headers(review_user)
      get '/api/v1/company_access/context', headers: auth

      expect(response).to have_http_status(:forbidden)
    end

    it 'returns active memberships and pending requests' do
      create(:company_member, user: company_user, company: company, status: 'active')
      create(:company_access_request,
             user: company_user,
             company: create(:company, status: 'active', moderation_status: 'approved'),
             status: 'pending')

      auth = auth_headers(company_user)
      get '/api/v1/company_access/context', headers: auth

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['active_memberships']).to be_an(Array)
      expect(body['pending_requests']).to be_an(Array)
      expect(body['active_memberships'].first['company_id']).to eq(company.id)
    end
  end
end
