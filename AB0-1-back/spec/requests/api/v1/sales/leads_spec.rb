# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Sales::Leads', type: :request do
  let(:tenant_company) { create(:company) }
  let(:other_company) { create(:company) }
  let(:sales_user) { create(:user, company: tenant_company, role: :company) }
  let(:other_user) { create(:user, company: other_company, role: :company) }
  let(:sales_role) do
    Sales::Role.create!(
      name: "Representante de vendas #{SecureRandom.hex(4)}",
      slug: "sales_rep_#{SecureRandom.hex(4)}",
      system: true
    )
  end
  let!(:sales_role_assignment) { Sales::UserRole.create!(user: sales_user, role: sales_role) }

  let(:pipeline_a) do
    Sales::Pipeline.create!(name: 'Pipeline A', key: "pipeline_a_#{SecureRandom.hex(4)}", active: false)
  end
  let(:pipeline_b) do
    Sales::Pipeline.create!(name: 'Pipeline B', key: "pipeline_b_#{SecureRandom.hex(4)}", active: true)
  end
  let!(:stage_a) { pipeline_a.stages.create!(name: 'Triagem A', key: 'triagem_a', position: 1, probability: 10) }
  let!(:stage_b) { pipeline_b.stages.create!(name: 'Triagem B', key: 'triagem_b', position: 1, probability: 20) }
  let!(:tenant_account) do
    Sales::Account.create!(company: tenant_company, owner: sales_user, name: 'Conta do tenant')
  end
  let!(:outside_account) do
    Sales::Account.create!(company: other_company, owner: other_user, name: 'Conta externa')
  end
  let!(:outside_opportunity) do
    outside_account.opportunities.create!(
      pipeline: pipeline_b,
      stage: stage_b,
      owner: other_user,
      name: 'Lead de outro tenant',
      status: 'open'
    )
  end

  def headers_for(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end

  def response_json
    JSON.parse(response.body)
  end

  def ids_from(collection)
    collection.map { |record| record.fetch('id') }
  end

  it 'keeps create, leads, opportunities and the selected board consistent for a non-admin sales user' do
    post '/api/v1/sales/leads',
         params: {
           lead: {
             name: 'Projeto no Pipeline B',
             sales_account_id: tenant_account.id,
             sales_pipeline_id: pipeline_b.id,
             stage_key: stage_b.key,
             temperature: 'hot',
             value_cents: 1_500_000
           }
         },
         headers: headers_for(sales_user),
         as: :json

    expect(response).to have_http_status(:created)
    created_id = response_json.dig('lead', 'id')
    expect(response_json.dig('lead', 'sales_pipeline_id')).to eq(pipeline_b.id)

    get '/api/v1/sales/leads', headers: headers_for(sales_user)
    expect(response).to have_http_status(:ok)
    expect(ids_from(response_json.fetch('leads'))).to include(created_id)
    expect(ids_from(response_json.fetch('leads'))).not_to include(outside_opportunity.id)

    get '/api/v1/sales/opportunities', headers: headers_for(sales_user)
    expect(response).to have_http_status(:ok)
    expect(ids_from(response_json.fetch('opportunities'))).to include(created_id)
    expect(ids_from(response_json.fetch('opportunities'))).not_to include(outside_opportunity.id)

    get "/api/v1/sales/pipelines/#{pipeline_b.id}/board", headers: headers_for(sales_user)
    expect(response).to have_http_status(:ok)
    expect(ids_from(response_json.fetch('cards'))).to include(created_id)
    expect(ids_from(response_json.fetch('cards'))).not_to include(outside_opportunity.id)

    get "/api/v1/sales/pipelines/#{pipeline_a.id}/board", headers: headers_for(sales_user)
    expect(response).to have_http_status(:ok)
    expect(ids_from(response_json.fetch('cards'))).not_to include(created_id)
  end

  it 'creates an inline account under the authenticated tenant and returns the lead on its board' do
    post '/api/v1/sales/leads',
         params: {
           lead: {
             name: 'Projeto com conta inline',
             sales_pipeline_id: pipeline_b.id,
             stage_key: stage_b.key,
             account: { name: 'Conta criada inline', domain: 'inline.example.test' }
           }
         },
         headers: headers_for(sales_user),
         as: :json

    expect(response).to have_http_status(:created)
    created_id = response_json.dig('lead', 'id')
    account = Sales::Account.find_by!(name: 'Conta criada inline')

    expect(account.owner).to eq(sales_user)
    expect(account.company_id).to eq(tenant_company.id)

    get "/api/v1/sales/pipelines/#{pipeline_b.id}/board", headers: headers_for(sales_user)
    expect(response).to have_http_status(:ok)
    expect(ids_from(response_json.fetch('cards'))).to include(created_id)
  end

  it 'rejects a stage that belongs to a different pipeline' do
    expect do
      post '/api/v1/sales/leads',
           params: {
             lead: {
               name: 'Estágio incompatível',
               sales_account_id: tenant_account.id,
               sales_pipeline_id: pipeline_b.id,
               stage_key: stage_a.key
             }
           },
           headers: headers_for(sales_user),
           as: :json
    end.not_to change(Sales::Opportunity, :count)

    expect(response).to have_http_status(:unprocessable_entity)
    expect(response_json.dig('error', 'code')).to eq('STAGE_PIPELINE_MISMATCH')
  end
end
