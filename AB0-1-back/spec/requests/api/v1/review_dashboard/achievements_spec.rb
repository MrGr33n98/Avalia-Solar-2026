# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Review dashboard achievements API', type: :request do
  let(:reviewer) { create(:user, role: 'review') }
  let(:company_user) { create(:user, role: 'company') }
  let(:token) { JWT.encode({ user_id: reviewer.id, typ: 'access' }, Rails.application.secret_key_base, 'HS256') }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  let!(:badge) do
    create(:achievement_badge,
           slug: 'review_approved_1',
           name: '1ª Avaliação Aprovada',
           category: 'review',
           tier: 'bronze',
           threshold: 1,
           points_xp: 50,
           action_enum: 'write_review',
           position: 1,
           active: true)
  end

  describe 'GET /api/v1/review_dashboard/achievements' do
    it 'retorna 200 OK com contrato canônico de conquistas para o avaliador' do
      get '/api/v1/review_dashboard/achievements', headers: headers

      expect(response).to have_http_status(:ok)
      expect(response.headers['X-Request-ID']).to be_present

      payload = JSON.parse(response.body)
      expect(payload['schema_version']).to eq('2026-11-v1')
      expect(payload).to include('summary', 'achievements', 'faq')
      expect(payload['summary']).to include('unlocked_count', 'total_count', 'xp_total', 'completion_percentage')
      expect(payload['achievements']).to be_an(Array)
      expect(payload['faq']).to be_an(Array)

      achievement = payload['achievements'].first
      expect(achievement).to include(
        'id' => 'review_approved_1',
        'name' => '1ª Avaliação Aprovada',
        'category' => 'review',
        'state' => 'locked',
        'progress' => 0,
        'threshold' => 1,
        'action' => 'write_review'
      )
      expect(achievement['asset']).to include('earned', 'locked')
    end

    it 'retorna 401 para requisições sem autenticação' do
      get '/api/v1/review_dashboard/achievements'

      expect(response).to have_http_status(:unauthorized)
    end

    it 'retorna 403 para usuários que não são avaliadores nem administradores' do
      company_token = JWT.encode(
        { user_id: company_user.id, typ: 'access' },
        Rails.application.secret_key_base,
        'HS256'
      )
      get '/api/v1/review_dashboard/achievements', headers: { 'Authorization' => "Bearer #{company_token}" }

      expect(response).to have_http_status(:forbidden)
    end

    it 'trata erros graciosamente retornando 503 com código estruturado' do
      allow(Gamification::ReadModelService).to receive(:new).and_raise(StandardError, 'database timeout')

      get '/api/v1/review_dashboard/achievements', headers: headers

      expect(response).to have_http_status(:service_unavailable)
      payload = JSON.parse(response.body)
      expect(payload.dig('error', 'code')).to eq('REVIEW_DASHBOARD_ACHIEVEMENTS_UNAVAILABLE')
    end
  end
end
