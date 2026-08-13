# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer profile API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:token) { JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}", 'Content-Type' => 'application/json' } }

  it 'requires authentication' do
    get '/api/v1/reviewer/profile'
    expect(response).to have_http_status(:unauthorized)
  end

  it 'returns and updates allowlisted profile data' do
    get '/api/v1/reviewer/profile', headers: headers
    expect(response).to have_http_status(:ok)
    patch '/api/v1/reviewer/profile', params: { profile: { profession: 'Arquiteta', bio: 'Bio', role: 'admin', green_score: 999 } }.to_json, headers: headers
    expect(response).to have_http_status(:ok)
    expect(reviewer.reload.reviewer_profile.profession).to eq('Arquiteta')
    expect(reviewer.reload).not_to have_attributes(role: 'admin')
  end
end
