# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP Observability & Performance Tools API', type: :request do
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')
  end

  def auth_headers(user)
    { 'Authorization' => "Bearer #{jwt_token_for(user)}", 'Accept' => 'application/json' }
  end

  let!(:admin_user) do
    User.create!(
      name: 'Observability Admin', email: 'obs_admin@avaliasolar.com.br', password: 'Password123!',
      terms_accepted: true, role: 'admin', confirmed_at: Time.current
    )
  end

  let!(:regular_user) do
    User.create!(
      name: 'Regular Consumer', email: 'consumer_obs@gmail.com', password: 'Password123!',
      terms_accepted: true, role: 'review', city: 'São Paulo', confirmed_at: Time.current
    )
  end

  describe 'Security Gates' do
    it 'DENY: Anonymous request to diagnose_performance returns 401' do
      post '/api/v1/mcp/tools/diagnose_performance', params: { arguments: {} }, headers: { 'Accept' => 'application/json' }
      expect(response).to have_http_status(:unauthorized)
    end

    it 'DENY: Non-admin user request to diagnose_performance returns 403' do
      post '/api/v1/mcp/tools/diagnose_performance', params: { arguments: {} }, headers: auth_headers(regular_user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'Tool Executions by Authorized Staff' do
    it 'ALLOW: Admin executes diagnose_performance and receives golden diagnostic contract' do
      post '/api/v1/mcp/tools/diagnose_performance', params: { arguments: { window_minutes: 15 } }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)

      expect(body['ok']).to be(true)
      expect(body['tool']).to eq('diagnose_performance')
      expect(body['data']).to have_key('status')
      expect(body['data']).to have_key('observations')
      expect(body['data']).to have_key('correlations')
      expect(body['data']).to have_key('hypotheses')
      expect(body['data']).to have_key('confirmed_causes')
      expect(body['data']).to have_key('recommendations')
      expect(body['data']).to have_key('metrics')
      expect(body['data']).to have_key('evidence')
    end

    it 'ALLOW: Admin executes get_system_health' do
      post '/api/v1/mcp/tools/get_system_health', params: { arguments: { deep: true } }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['data']).to have_key('status')
      expect(body['data']['components']).to have_key('database')
      expect(body['data']['components']).to have_key('redis')
      expect(body['data']['components']).to have_key('sidekiq')
      expect(body['data']['components']).to have_key('outbox')
    end

    it 'ALLOW: Admin executes get_outbox_health' do
      post '/api/v1/mcp/tools/get_outbox_health', params: { arguments: {} }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['data']).to have_key('status')
      expect(body['data']['metrics']).to have_key('pending_count')
      expect(body['data']['metrics']).to have_key('dead_letter_count')
    end

    it 'ALLOW: Admin executes get_postgres_health' do
      post '/api/v1/mcp/tools/get_postgres_health', params: { arguments: {} }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['data']).to have_key('status')
      expect(body['data']).to have_key('latency_ms')
      expect(body['data']).to have_key('pool_size')
    end

    it 'ALLOW: Admin executes get_redis_health' do
      post '/api/v1/mcp/tools/get_redis_health', params: { arguments: {} }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['data']).to have_key('status')
    end

    it 'ALLOW: Admin executes get_sidekiq_health' do
      post '/api/v1/mcp/tools/get_sidekiq_health', params: { arguments: {} }, headers: auth_headers(admin_user)

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['data']).to have_key('status')
    end
  end
end
