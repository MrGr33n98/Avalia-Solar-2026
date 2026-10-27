# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Sales Snapshots API', type: :request do
  describe 'GET /api/v1/sales/reports/snapshots' do
    it 'define o endpoint de snapshots nas rotas' do
      has_route = Rails.application.routes.routes.any? do |route|
        route.path.spec.to_s.include?('/api/v1/sales/reports/snapshots')
      end
      expect(has_route).to be(true)
    end

    context 'when unauthenticated' do
      it 'returns 401 Unauthorized' do
        get '/api/v1/sales/reports/snapshots'
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when authenticated with sales permissions' do
      let(:company) { create(:company) }
      let(:user) { create(:user, company: company, role: :company) }
      let(:sales_role) { Sales::Role.create!(name: 'Sales Manager', slug: "manager_#{SecureRandom.hex(4)}", system: true) }

      before do
        Sales::UserRole.create!(user: user, role: sales_role)
      end

      it 'returns 422 when from date is after to date' do
        get '/api/v1/sales/reports/snapshots',
            params: { from: '2026-10-27', to: '2026-09-01' },
            headers: auth_headers(user)

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('Data inicial não pode ser superior')
      end

      it 'returns structured JSON response with meta, pipeline, and win_rate sections' do
        get '/api/v1/sales/reports/snapshots',
            params: { from: '2026-08-01', to: '2026-10-27', granularity: 'week' },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)

        expect(json).to have_key('meta')
        expect(json).to have_key('pipeline')
        expect(json).to have_key('win_rate')

        expect(json.dig('meta', 'granularity')).to eq('week')
        expect(json.dig('pipeline', 'summary')).to have_key('avg_open_count')
        expect(json.dig('win_rate', 'summary')).to have_key('win_rate_pct')
      end

      it 'returns CSV file when format is csv' do
        get '/api/v1/sales/reports/snapshots.csv',
            params: { from: '2026-08-01', to: '2026-10-27' },
            headers: auth_headers(user)

        expect(response).to have_http_status(:ok)
        expect(response.content_type).to include('text/csv')
        expect(response.body).to include('Tipo,Data')
      end
    end
  end

  describe 'Sales::CapturePipelineDailySnapshotJob' do
    it 'executa de forma idempotente sem duplicar registros' do
      job = Sales::CapturePipelineDailySnapshotJob.new
      result1 = job.perform(Date.current)
      result2 = job.perform(Date.current)

      expect(result1[:status]).to eq('success')
      expect(result2[:status]).to eq('success')
      expect(result2[:snapshots_count]).to eq(result1[:snapshots_count])
    end
  end

  private

  def auth_headers(user)
    token = JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
    { 'Authorization' => "Bearer #{token}", 'Accept' => 'application/json' }
  end
end
