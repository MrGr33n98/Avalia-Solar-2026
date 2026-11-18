# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Reviewer solutions API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:other_reviewer) { create(:user, role: 'review') }
  let(:headers) do
    {
      'Authorization' => "Bearer #{JWT.encode({ user_id: reviewer.id, typ: 'access', exp: 24.hours.from_now.to_i, iat: Time.current.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')}",
      'Content-Type' => 'application/json'
    }
  end

  it 'lists only current reviewer solutions' do
    own = create(:reviewer_solution, user: reviewer)
    create(:reviewer_solution, user: other_reviewer)
    get '/api/v1/reviewer_solutions', headers: headers
    expect(response).to have_http_status(:ok)
    expect(JSON.parse(response.body).map { |item| item['id'] }).to eq([own.id.to_s])
  end

  it 'creates solution for current reviewer with legacy payload' do
    expect do
      post '/api/v1/reviewer_solutions',
           params: { solution: { name: 'Sistema solar', solution_type: 'technology', category: 'Energia Solar' } }.to_json,
           headers: headers
    end.to change(ReviewerSolution, :count).by(1)
    expect(response).to have_http_status(:created)
  end

  it 'creates solution linked to brand and product' do
    brand = create(:brand, name: 'Growatt')
    product = create(:product, name: 'MIN 5000', brand: brand)

    post '/api/v1/reviewer_solutions',
         params: {
           solution: {
             name: 'Inversor 5kW Growatt',
             solution_type: 'product',
             category: 'Energia Solar',
             brand_id: brand.id,
             product_id: product.id,
             usage_context: 'integrator_install'
           }
         }.to_json,
         headers: headers

    expect(response).to have_http_status(:created)
    body = JSON.parse(response.body)
    expect(body['brand_id']).to eq(brand.id)
    expect(body['product_id']).to eq(product.id)
    expect(body['usage_context']).to eq('integrator_install')
    expect(body['brand']['name']).to eq('Growatt')
  end

  it 'returns 422 unprocessable entity if product does not belong to selected brand' do
    brand1 = create(:brand, name: 'Growatt')
    brand2 = create(:brand, name: 'Fronius')
    product = create(:product, name: 'Primo 5.0', brand: brand2)

    post '/api/v1/reviewer_solutions',
         params: {
           solution: {
             name: 'Conflito de Marca',
             solution_type: 'product',
             category: 'Energia Solar',
             brand_id: brand1.id,
             product_id: product.id
           }
         }.to_json,
         headers: headers

    expect(response).to have_http_status(:unprocessable_entity)
    body = JSON.parse(response.body)
    expect(body['errors'].join).to include('não pertence à marca selecionada')
  end

  it 'reactivates a previously disabled solution when user adds with the same name' do
    solution = create(:reviewer_solution, user: reviewer, name: 'Solução Reutilizada', status: 'disabled')

    expect do
      post '/api/v1/reviewer_solutions',
           params: {
             solution: {
               name: 'Solução Reutilizada',
               solution_type: 'product',
               category: 'Armazenamento',
               usage_context: 'personal_owner'
             }
           }.to_json,
           headers: headers
    end.not_to change(ReviewerSolution, :count)

    expect(response).to have_http_status(:ok)
    expect(solution.reload.status).to eq('active')
    expect(solution.category).to eq('Armazenamento')
    expect(ReviewerSolutionEvent.where(reviewer_solution: solution, action: 'reactivated').count).to eq(1)
  end

  it 'does not allow deleting another reviewer solution' do
    solution = create(:reviewer_solution, user: other_reviewer)
    delete "/api/v1/reviewer_solutions/#{solution.id}", headers: headers
    expect(response).to have_http_status(:not_found)
  end
end
