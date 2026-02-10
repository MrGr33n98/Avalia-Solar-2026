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
  end
end
