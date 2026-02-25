require 'rails_helper'

RSpec.describe 'Api::V1::WidgetData', type: :request do
  let!(:company) { create(:company, verified: true, api_key: 'test_key', trust_score: 90) }

  describe 'GET /api/v1/companies/:id/widget_data' do
    context 'with valid api_key' do
      it 'returns company trust data' do
        get "/api/v1/companies/#{company.id}/widget_data", params: { api_key: 'test_key' }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['company_id']).to eq(company.id)
        expect(json['verified']).to be true
        expect(json['trust_score']).to eq(90.0)
        expect(json).to have_key('verified_badge_image_url')
      end
    end

    context 'with invalid api_key' do
      it 'returns unauthorized' do
        get "/api/v1/companies/#{company.id}/widget_data", params: { api_key: 'wrong_key' }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'without api_key' do
      it 'returns unauthorized' do
        get "/api/v1/companies/#{company.id}/widget_data"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
