# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer dashboard API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:token) { JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256') }
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

  describe 'GET /api/v1/reviewer/analytics' do
    let!(:profile) { create(:reviewer_profile, user: reviewer, creator_enabled: true, tree_views_count: 42) }
    let(:auth_headers) do
      jwt = JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')
      { 'Authorization' => "Bearer #{jwt}" }
    end

    it 'returns views, followers, clicks, and daily_views preserving the JSON contract' do
      publication = create(:reviewer_publication, user: reviewer)
      ReviewerPublicationEvent.create!(
        reviewer_publication: publication,
        event_name: 'publication_view',
        created_at: Time.current,
        updated_at: Time.current
      )

      get '/api/v1/reviewer/analytics', headers: auth_headers

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body)
      expect(payload).to include('views', 'followers', 'clicks', 'daily_views')
      expect(payload['views']).to eq(43)
      expect(payload['daily_views'].size).to eq(7)
      expect(payload['daily_views'].last).to eq('date' => Time.zone.today.strftime('%d/%m'), 'views' => 1)
    end
  end
end
