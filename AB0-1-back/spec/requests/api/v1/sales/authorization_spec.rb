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
          state: 'SP'
        )

        get '/api/v1/sales/leads', headers: { 'Authorization' => "Bearer #{company_user.id}" }
        expect(response.status).to eq(401).or eq(403)
      end
    end
  end
end
