require 'rails_helper'

RSpec.describe 'Reviews API', type: :request do
  let(:headers) { { 'Content-Type' => 'application/json', 'Accept' => 'application/json' } }
  let(:company) { create(:company) }

  let(:review_user) do
    create(
      :user,
      role: 'review',
      status: :active,
      company: nil,
      city: 'Sao Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:company_user) do
    create(
      :user,
      role: 'company',
      status: :active,
      company: nil,
      confirmed_at: Time.current
    )
  end

  let(:legacy_user) do
    user = create(
      :user,
      role: 'review',
      status: :active,
      company: nil,
      city: 'Sao Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
    user.update_column(:role, 'user')
    user
  end

  def auth_headers(user)
    post '/api/v1/auth/login',
         params: { email: user.email, password: 'Password123' }.to_json,
         headers: headers

    expect(response).to have_http_status(:ok)

    token = JSON.parse(response.body)['token']
    expect(token).to be_present

    headers.merge('Authorization' => "Bearer #{token}")
  end

  def review_payload
    {
      review: {
        company_id: company.id,
        rating: 5,
        comment: 'Excelente atendimento e suporte durante todo o processo.'
      }
    }
  end

  before do
    allow(Analytics::TrackEventService).to receive(:call)
    allow(SlackNotificationService).to receive(:notify_review)
    allow(TrustScoreRecalculationWorker).to receive(:perform_async)
    allow(AiModerationWorker).to receive(:perform_async)
  end

  describe 'POST /api/v1/reviews' do
    it 'creates a review for a review user' do
      auth = auth_headers(review_user)

      expect do
        post '/api/v1/reviews', params: review_payload.to_json, headers: auth
      end.to change(Review, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(Review.last.user_id).to eq(review_user.id)
      expect(Review.last.company_id).to eq(company.id)
      json = JSON.parse(response.body)
      expect(json['user']).to include('id' => review_user.id, 'name' => review_user.name, 'avatar_url' => nil)
      expect(json['company']).to include('id' => company.id, 'name' => company.name)
    end

    it 'creates a review for a company user' do
      auth = auth_headers(company_user)

      expect do
        post '/api/v1/reviews', params: review_payload.to_json, headers: auth
      end.to change(Review, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(Review.last.user_id).to eq(company_user.id)
    end

    it 'creates a review for a legacy user role' do
      auth = auth_headers(legacy_user)

      expect do
        post '/api/v1/reviews', params: review_payload.to_json, headers: auth
      end.to change(Review, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(Review.last.user_id).to eq(legacy_user.id)
    end

    it 'returns unauthorized without authentication' do
      post '/api/v1/reviews', params: review_payload.to_json, headers: headers

      expect(response).to have_http_status(:unauthorized)
    end

    it 'creates a review with granular criterion scores' do
      auth = auth_headers(review_user)
      criterion = create(:rating_criterion, title: 'Atendimento', slug: 'atendimento')

      payload = {
        review: {
          company_id: company.id,
          rating: 4,
          comment: 'Gostei do atendimento.',
          review_criterion_scores_attributes: [
            { rating_criterion_id: criterion.id, score: 5 }
          ]
        }
      }

      expect do
        post '/api/v1/reviews', params: payload.to_json, headers: auth
      end.to change(ReviewCriterionScore, :count).by(1)

      expect(response).to have_http_status(:created)
      review = Review.last
      expect(review.review_criterion_scores.first.score).to eq(5)
      expect(review.review_criterion_scores.first.rating_criterion_id).to eq(criterion.id)
      json = JSON.parse(response.body)
      expect(json['review_criterion_scores']).to contain_exactly(
        include(
          'rating_criterion_id' => criterion.id,
          'score' => 5.0,
          'title' => criterion.title
        )
      )
    end
  end

  describe 'GET /api/v1/reviews' do
    it 'returns approved reviews with nested user payload even without avatar attachment' do
      review = create(:review, company: company, user: review_user, status: :approved)

      get '/api/v1/reviews', params: { company_id: company.id, limit: 10 }, headers: headers

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json).to contain_exactly(
        include(
          'id' => review.id,
          'user' => include(
            'id' => review_user.id,
            'name' => review_user.name,
            'avatar_url' => nil
          ),
          'company' => include(
            'id' => company.id,
            'name' => company.name
          )
        )
      )
    end
  end
end
