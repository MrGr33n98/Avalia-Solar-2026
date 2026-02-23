require 'rails_helper'

RSpec.describe 'Admin Reviews API', type: :request do
  include Devise::Test::IntegrationHelpers

  let(:admin_user) do
    AdminUser.create!(
      email: 'admin@example.com',
      password: 'password123',
      password_confirmation: 'password123'
    )
  end

  let(:company) { create(:company) }
  let!(:pending_review) { create(:review, company: company, status: :pending) }
  let!(:approved_review) { create(:review, company: company, status: :approved) }

  before do
    allow(ReviewDecisionNotifier).to receive(:with).and_return(double(deliver_later: true))
    allow(ReviewDecisionMailer).to receive(:with)
      .and_return(double(decision_notification: double(deliver_later: true)))
  end

  describe 'GET /api/v1/admin/reviews' do
    it 'returns filtered reviews for admin' do
      sign_in admin_user

      get '/api/v1/admin/reviews', params: { status: 'pending' }
      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)
      expect(body['data']).to all(include('status' => 'pending'))
    end

    it 'requires authentication' do
      get '/api/v1/admin/reviews'
      expect(response).to have_http_status(:found)
    end
  end

  describe 'PATCH /api/v1/admin/reviews/:id/approve' do
    it 'approves a review' do
      sign_in admin_user
      patch "/api/v1/admin/reviews/#{pending_review.id}/approve"

      expect(response).to have_http_status(:ok)
      expect(pending_review.reload).to be_approved
    end
  end

  describe 'PATCH /api/v1/admin/reviews/:id/reject' do
    it 'rejects a review and logs the action' do
      sign_in admin_user

      patch "/api/v1/admin/reviews/#{pending_review.id}/reject"
      expect(response).to have_http_status(:ok)
      expect(pending_review.reload).to be_rejected
      expect(pending_review.review_decision_logs.last.action).to eq('rejected')
    end
  end
end
