# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer dashboard API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:token) { JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  describe 'GET /api/v1/reviewer/dashboard' do
    it 'returns only current user data' do
      create(:review, user: reviewer)
      create(:review, user: other_reviewer)

      get '/api/v1/reviewer/dashboard', headers: headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload['summary']['reviews_total']).to eq(1)
      expect(payload).to include('green_score', 'recent_activity', 'journeys', 'achievements')
    end

    it 'rejects unauthenticated access' do
      get '/api/v1/reviewer/dashboard'
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
