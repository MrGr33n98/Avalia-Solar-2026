# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer solutions API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:headers) { { 'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256')}", 'Content-Type' => 'application/json' } }

  it 'lists only current reviewer solutions' do
    own = create(:reviewer_solution, user: reviewer)
    create(:reviewer_solution, user: other_reviewer)
    get '/api/v1/reviewer_solutions', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).map { |item| item['id'] }).to eq([own.id.to_s])
  end

  it 'creates solution for current reviewer' do
    expect do
      post '/api/v1/reviewer_solutions', params: { solution: { name: 'Sistema solar', solution_type: 'technology', category: 'Energia Solar' } }.to_json, headers: headers
    end.to change(ReviewerSolution, :count).by(1)
    expect(response).to have_http_status(:created)
  end

  it 'does not allow deleting another reviewer solution' do
    solution = create(:reviewer_solution, user: other_reviewer)
    delete "/api/v1/reviewer_solutions/#{solution.id}", headers: headers
    expect(response).to have_http_status(:not_found)
  end
end
