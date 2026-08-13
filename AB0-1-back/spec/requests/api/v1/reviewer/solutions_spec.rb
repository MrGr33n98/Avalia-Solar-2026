# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer solutions API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:headers) { { 'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id }, Rails.application.secret_key_base, 'HS256')}", 'Content-Type' => 'application/json' } }

  it 'rejects unauthenticated access' do
    get '/api/v1/reviewer_solutions'
    expect(response).to have_http_status(:unauthorized)
  end

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

  it 'rejects invalid payload' do
    post '/api/v1/reviewer_solutions', params: { solution: { name: '', solution_type: 'unknown', category: '' } }.to_json, headers: headers
    expect(response).to have_http_status(:unprocessable_entity)
  end

  it 'ignores malicious user_id' do
    post '/api/v1/reviewer_solutions', params: { solution: { name: 'Própria', solution_type: 'technology', category: 'Solar', user_id: other_reviewer.id } }.to_json, headers: headers
    expect(response).to have_http_status(:created)
    expect(ReviewerSolution.last.user_id).to eq(reviewer.id)
  end

  it 'desativa a própria solução e mantém o histórico' do
    solution = create(:reviewer_solution, user: reviewer)
    delete "/api/v1/reviewer_solutions/#{solution.id}", headers: headers
    expect(response).to have_http_status(:no_content)
    expect(solution.reload.status).to eq('disabled')
    expect(ReviewerSolutionEvent.last.action).to eq('removed')
  end

  it 'does not allow deleting another reviewer solution' do
    solution = create(:reviewer_solution, user: other_reviewer)
    delete "/api/v1/reviewer_solutions/#{solution.id}", headers: headers
    expect(response).to have_http_status(:not_found)
  end
end
