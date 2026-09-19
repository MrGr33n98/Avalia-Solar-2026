# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Revenue MCP com Sales API Key', type: :request do
  let(:company) { create(:company) }
  let(:user) { create(:user, company: company) }

  it 'estabelece o tenant pelo usuário vinculado à chave de API sem aceitar tenant arbitrário' do
    create(:company_member, company: company, user: user, status: 'active')
    _api_key, raw_key = Sales::ApiKey.issue!(user: user, name: 'MCP Revenue test', company: company)

    post '/api/v1/mcp/tools/revenue_get_pipeline_metrics',
         params: { arguments: { company_id: company.id } },
         headers: { 'Authorization' => "Bearer #{raw_key}" },
         as: :json

    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body).to include('ok' => true, 'tool' => 'revenue_get_pipeline_metrics')
    expect(response.parsed_body.dig('meta', 'tenant_id')).to eq(company.id)
  end

  it 'falha de forma segura sem uma chave de API válida' do
    post '/api/v1/mcp/tools/revenue_get_pipeline_metrics', params: { arguments: {} }, as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body.dig('error', 'code')).to eq('authentication_required')

    invalid_key = 'chave-invalida-para-validacao'
    post '/api/v1/mcp/tools/revenue_get_pipeline_metrics',
         params: { arguments: {} },
         headers: { 'Authorization' => "Bearer #{invalid_key}" },
         as: :json

    expect(response).to have_http_status(:unauthorized)
    expect(response.parsed_body.dig('error', 'code')).to eq('authentication_required')
    expect(response.body).not_to include(invalid_key)
  end

  it 'rejeita um identificador de tenant diferente da chave autenticada' do
    create(:company_member, company: company, user: user, status: 'active')
    _api_key, raw_key = Sales::ApiKey.issue!(user: user, name: 'MCP Revenue test', company: company)
    other_company = create(:company)

    post '/api/v1/mcp/tools/revenue_get_pipeline_metrics',
         params: { arguments: { company_id: other_company.id } },
         headers: { 'Authorization' => "Bearer #{raw_key}" },
         as: :json

    expect(response).to have_http_status(:forbidden)
    expect(response.parsed_body.dig('error', 'code')).to eq('cross_tenant_violation')
  end
end
