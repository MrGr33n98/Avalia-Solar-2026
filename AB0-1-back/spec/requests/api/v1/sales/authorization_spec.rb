# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales Authorization & Surface Isolation', type: :request do
  describe 'GET /api/v1/sales/leads' do
    context 'when unauthenticated' do
      it 'denies access with 401 unauthorized' do
        get '/api/v1/sales/leads'
        expect(response.status).to eq(401).or eq(403)
      end
    end

    context 'when authenticated as company user (non-internal)' do
      it 'denies access to sales CRM endpoint' do
        company_user = ::User.create!(
          name: 'Company User',
          email: 'company@solarexample.com',
          password: 'Password123!',
          role: 'company',
          city: 'São Paulo',
          state: 'SP',
          terms_accepted: true
        )

        token = JWT.encode(
          { user_id: company_user.id, typ: 'access', exp: 24.hours.from_now.to_i },
          Rails.application.secret_key_base,
          'HS256'
        )
        get '/api/v1/sales/leads', headers: { 'Authorization' => "Bearer #{token}" }
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end
