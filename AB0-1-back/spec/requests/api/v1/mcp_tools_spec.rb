# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP tools API', type: :request do
  before { allow(Rails.cache).to receive(:increment).and_return(1) }

  describe 'POST /api/v1/mcp/tools/:tool_name' do
    it 'rejects unknown tools with the standard contract' do
      post '/api/v1/mcp/tools/not_a_tool', params: { arguments: {} }, as: :json

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to include(
        'ok' => false,
        'tool' => 'not_a_tool',
        'error' => include('code' => 'unknown_tool')
      )
    end

    it 'validates public search arguments' do
      post '/api/v1/mcp/tools/search_companies', params: { arguments: {} }, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body.dig('error', 'code')).to eq('invalid_params')
    end

    it 'returns real companies through the public search tool' do
      company = create(:company, name: 'Voltaia Brasil', status: :active)

      post '/api/v1/mcp/tools/search_companies', params: { arguments: { query: 'voltaia' } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include('ok' => true, 'tool' => 'search_companies')
      expect(response.parsed_body.dig('data', 'companies', 0, 'id')).to eq(company.id)
      expect(response.parsed_body['meta']).to include('request_id', 'execution_ms')
    end

    it 'does not expose company metrics without authentication' do
      post '/api/v1/mcp/tools/get_company_dashboard_metrics', params: { arguments: {} }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.dig('error', 'code')).to eq('authentication_required')
    end

    it 'allows an active company member to read only its metrics' do
      company = create(:company, status: :active)
      user = create(:user, company: company, role: 'company')
      create(:company_member, company: company, user: user, status: 'active')
      token = JWT.encode({ user_id: user.id }, Rails.application.secret_key_base, 'HS256')

      post '/api/v1/mcp/tools/get_company_dashboard_metrics',
           params: { arguments: { company_id: company.id } },
           headers: { 'Authorization' => "Bearer #{token}" },
           as: :json

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig('data', 'company', 'id')).to eq(company.id)
    end
  end
end
