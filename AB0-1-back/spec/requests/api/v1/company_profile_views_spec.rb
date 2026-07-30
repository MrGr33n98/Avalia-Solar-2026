# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'GET /api/v1/companies/:id/views_count', type: :request do
  let(:company) { create(:company) }

  context 'com 0 visualizações' do
    it 'retorna 0' do
      get views_count_api_v1_company_path(company)
      expect(response).to have_http_status(:ok)
      expect(json_body['views_count']).to eq(0)
    end
  end

  context 'com visualizações registradas' do
    before do
      create_list(:company_profile_view, 5, company: company)
    end

    it 'retorna a contagem correta' do
      get views_count_api_v1_company_path(company)
      expect(json_body['views_count']).to eq(5)
    end

    it 'usa cache Redis (resposta < 50ms)' do
      # Primeira chamada — popula cache
      get views_count_api_v1_company_path(company)
      start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      # Segunda chamada — deve vir do cache
      get views_count_api_v1_company_path(company)
      elapsed_ms = (Process.clock_gettime(Process::CLOCK_MONOTONIC) - start) * 1000
      expect(elapsed_ms).to be < 50
    end
  end
end

RSpec.describe 'POST /api/v1/companies/:id/track_view', type: :request do
  let(:company) { create(:company) }
  let(:chrome_ua) { 'Mozilla/5.0 Chrome/120.0.0.0' }

  context 'com visitante válido' do
    it 'registra a visualização e retorna tracked: true' do
      post track_view_api_v1_company_path(company),
           headers: { 'User-Agent' => chrome_ua, 'REMOTE_ADDR' => '10.0.0.1' }

      expect(response).to have_http_status(:ok)
      expect(json_body['tracked']).to be true
      expect(json_body['reason']).to  eq('ok')
    end
  end

  context 'com bot' do
    it 'retorna tracked: false com reason bot_user_agent' do
      post track_view_api_v1_company_path(company),
           headers: { 'User-Agent' => 'Googlebot/2.1' }

      expect(response).to have_http_status(:ok)
      expect(json_body['tracked']).to be false
      expect(json_body['reason']).to  eq('bot_user_agent')
    end
  end

  context 'com empresa inexistente' do
    it 'retorna 404' do
      post track_view_api_v1_company_path(id: 99_999_999)
      expect(response).to have_http_status(:not_found)
    end
  end

  def json_body
    JSON.parse(response.body)
  end
end
