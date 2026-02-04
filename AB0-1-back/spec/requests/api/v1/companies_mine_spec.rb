# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Companies mine endpoint', type: :request do
  let(:user) { create(:user, email: 'mine@example.com', password: 'Password123', status: :active, role: 'company', confirmed_at: Time.current) }
  let(:company) { create(:company, name: 'Minha Empresa Solar') }
  let(:other_company) { create(:company, name: 'Outra Empresa') }
  let(:headers) { { 'Content-Type' => 'application/json' } }

  before do
    # Vincular empresa ao usuário como membro ativo
    create(:company_member, user: user, company: company, status: 'active')
  end

  describe 'GET /api/v1/companies/mine' do
    context 'when authenticated' do
      before do
        # Login para obter o token JWT
        post '/api/v1/auth/login', 
             params: { email: user.email, password: 'Password123' }.to_json, 
             headers: headers
        
        @token = JSON.parse(response.body)['token']
        @auth_headers = headers.merge('Authorization' => "Bearer #{@token}")
      end

      it 'returns the user companies' do
        get '/api/v1/companies/mine', headers: @auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        
        expect(payload).to be_an(Array)
        expect(payload.size).to eq(1)
        expect(payload.first['name']).to eq('Minha Empresa Solar')
      end

      it 'filters companies by name' do
        get '/api/v1/companies/mine', params: { q: 'Minha' }, headers: @auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload.size).to eq(1)
        expect(payload.first['name']).to eq('Minha Empresa Solar')
      end

      it 'returns empty array when no matches found' do
        get '/api/v1/companies/mine', params: { q: 'Inexistente' }, headers: @auth_headers

        expect(response).to have_http_status(:ok)
        payload = JSON.parse(response.body)
        expect(payload).to be_empty
      end

      context 'caching' do
        it 'caches the response' do
          # Primeira chamada para popular o cache
          # Usamos at_least(:once) porque o Rack::Attack também pode usar o cache
          expect(Rails.cache).to receive(:fetch).at_least(:once).and_call_original
          get '/api/v1/companies/mine', headers: @auth_headers
          expect(response).to have_http_status(:ok)
          
          # Segunda chamada
          get '/api/v1/companies/mine', headers: @auth_headers
          expect(response).to have_http_status(:ok)
        end
      end
    end

    context 'when not authenticated' do
      it 'returns 401 unauthorized' do
        get '/api/v1/companies/mine', headers: headers

        expect(response).to have_http_status(:unauthorized)
        payload = JSON.parse(response.body)
        expect(payload['message']).to eq('Authentication required')
        expect(payload['code']).to eq('UNAUTHORIZED')
      end
    end
  end
end
