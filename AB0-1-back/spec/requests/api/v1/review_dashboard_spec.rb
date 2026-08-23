# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Review dashboard summary API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:headers) { { 'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')}" } }

  it 'returns summary for reviewer' do
    get '/api/v1/review_dashboard/summary', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body)).to include('kpis', 'gamification', 'profile')
  end

  it 'keeps summary available when Green Score is unavailable' do
    allow_any_instance_of(User).to receive(:calculate_green_score).and_raise(StandardError, 'database unavailable')
    get '/api/v1/review_dashboard/summary', headers: headers
    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload.dig('meta', 'partial')).to be(true)
    expect(payload.dig('meta', 'stale_sections')).to include('gamification')
    expect(payload.dig('gamification', 'green_score')).to be_nil
    expect(response.body).not_to include('520')
  end
end
