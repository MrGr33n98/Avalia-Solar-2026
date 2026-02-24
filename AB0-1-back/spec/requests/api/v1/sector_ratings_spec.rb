require 'rails_helper'

RSpec.describe 'Sector Ratings API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json' } }
  let(:company) do
    create(
      :company,
      status: 'active',
      moderation_status: 'approved',
      sector_ratings_enabled: true,
      state: 'SP',
      city: 'Sao Paulo'
    )
  end
  let(:review_user) do
    create(:user,
           role: 'review',
           status: :active,
           company: nil,
           city: 'Sao Paulo',
           state: 'SP',
           confirmed_at: Time.current)
  end

  def auth_headers(user)
    post '/api/v1/auth/login',
         params: { email: user.email, password: 'Password123' }.to_json,
         headers: headers
    token = JSON.parse(response.body)['token']
    headers.merge('Authorization' => "Bearer #{token}")
  end

  describe 'GET /companies/:id/sector_ratings/questions' do
    it 'allows review users to fetch custom questions without membership' do
      question = CompanySectorQuestion.create!(company: company, prompt: 'Tempo de resposta', weight: 2, order: 1, enabled: true)
      get "/api/v1/companies/#{company.id}/sector_ratings/questions", headers: auth_headers(review_user)

      expect(response).to have_http_status(:ok)
      parsed = JSON.parse(response.body)
      expect(parsed.first['id']).to eq(question.id)
      expect(parsed.first['prompt']).to include('Tempo de resposta')
    end
  end

  describe 'POST /companies/:id/sector_ratings' do
    it 'persists answers json and computes weighted score' do
      q1 = CompanySectorQuestion.create!(company: company, prompt: 'Tempo de resposta', weight: 2, order: 1, enabled: true)
      q2 = CompanySectorQuestion.create!(company: company, prompt: 'Qualidade', weight: 1, order: 2, enabled: true)

      payload = {
        sector_rating: {
          answers: {
            q1.id => 5,
            q2.id => 3
          },
          comment: 'Boa experiência'
        }
      }

      post "/api/v1/companies/#{company.id}/sector_ratings",
           params: payload.to_json,
           headers: auth_headers(review_user)

      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['answers'][q1.id.to_s]).to eq(5)
      expect(body['answers'][q2.id.to_s]).to eq(3)
      expect(body['total_score']).to eq(4.3)
    end
  end
end
