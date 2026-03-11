require 'rails_helper'

RSpec.describe 'Intent scores API', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }
  let(:token) { JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) do
    {
      'ACCEPT' => 'application/json',
      'Authorization' => "Bearer #{token}"
    }
  end

  let!(:warm_score) do
    create(
      :intent_score,
      company: company,
      anonymous_id: 'anon-warm',
      total_score: 45,
      last_interaction_at: 2.hours.ago
    )
  end

  let!(:immediate_score) do
    create(
      :intent_score,
      company: company,
      anonymous_id: 'anon-immediate',
      total_score: 82,
      last_interaction_at: 30.minutes.ago
    )
  end

  describe 'GET /api/v1/intent_scores' do
    it 'returns ranked scores for the requested company' do
      get '/api/v1/intent_scores', params: { company_id: company.id }, headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['total']).to eq(2)
      expect(body['scores'].map { |score| score['total_score'] }).to eq([82, 45])
    end
  end

  describe 'GET /api/v1/intent_scores/summary' do
    it 'returns the level breakdown for the requested company' do
      get '/api/v1/intent_scores/summary', params: { company_id: company.id }, headers: headers

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['breakdown']['warm']).to eq(1)
      expect(body['breakdown']['boiling']).to eq(1)
      expect(body['actionable_count']).to eq(1)
    end
  end
end
