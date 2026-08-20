# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Gamification API', type: :request do
  let(:reviewer) { create(:user, role: 'review', city: 'São Paulo', state: 'SP') }
  let(:headers) { { 'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256')}" } }

  it 'returns gamification summary' do
    get '/api/v1/gamification/summary', headers: headers
    expect(response).to have_http_status(:ok)
    payload = JSON.parse(response.body)
    expect(payload).to include('green_score', 'regional_ranking', 'achievements', 'earned_points', 'level')
    expect(payload['level']['key']).to eq('beginner')
  end
end
