# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Api::V1::Mcp::Approvals', type: :request do
  def jwt_token_for(user)
    JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
  end

  let(:company) { FactoryBot.create(:company, name: 'Solar API Inc') }

  let(:admin_user) do
    User.create!(
      name: 'Admin User',
      email: 'admin_req@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:other_admin) do
    User.create!(
      name: 'Second Admin',
      email: 'admin2_req@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:regular_user) do
    User.create!(
      name: 'Regular User',
      email: 'regular_req@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'user',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:admin_token) { jwt_token_for(admin_user) }
  let(:other_admin_token) { jwt_token_for(other_admin) }
  let(:regular_token) { jwt_token_for(regular_user) }

  let!(:approval1) do
    McpApprovalRequest.create!(
      agent_id: 'agent:engineering:primary',
      tool_name: 'send_outbound_campaign',
      risk_tier: 'r3',
      tenant_id: company.id,
      requested_by_user_id: admin_user.id,
      parameters_payload: { 'campaign_id' => 101 }
    )
  end

  let!(:approval2) do
    McpApprovalRequest.create!(
      agent_id: 'agent:support:triage',
      tool_name: 'create_review_request',
      risk_tier: 'r2',
      tenant_id: company.id,
      requested_by_user_id: regular_user.id,
      parameters_payload: { 'company_id' => company.id }
    )
  end

  describe 'GET /api/v1/mcp/approvals' do
    it 'nega acesso a usuários anônimos (401)' do
      get '/api/v1/mcp/approvals'
      expect(response).to have_http_status(:unauthorized)
    end

    it 'nega acesso a usuários sem permissão interna (403)' do
      get '/api/v1/mcp/approvals', headers: { 'Authorization' => "Bearer #{regular_token}" }
      expect(response).to have_http_status(:forbidden)
    end

    it 'retorna lista paginada para administradores' do
      get '/api/v1/mcp/approvals', headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['data']).to be_an(Array)
      expect(json['data'].size).to be >= 2
      expect(json['meta']['total']).to be >= 2
    end

    it 'filtra por status e risk_tier' do
      get '/api/v1/mcp/approvals', params: { risk_tier: 'r3' }, headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['data'].all? { |r| r['risk_tier'] == 'r3' }).to be true
    end
  end

  describe 'GET /api/v1/mcp/approvals/stats' do
    it 'retorna contadores reais do banco de dados' do
      get '/api/v1/mcp/approvals/stats', headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      stats = json['stats']
      expect(stats['pending']).to be >= 2
      expect(stats['high_risk_pending']).to be >= 1
    end
  end

  describe 'GET /api/v1/mcp/approvals/:request_uuid' do
    it 'retorna detalhes seguros com política de aprovação e redaction' do
      get "/api/v1/mcp/approvals/#{approval1.request_uuid}", headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['data']['request_uuid']).to eq(approval1.request_uuid)
      expect(json['data']['payload_digest']).to be_present
      expect(json['policy']['who_can_approve']).to be_present
    end
  end

  describe 'POST /api/v1/mcp/approvals/:request_uuid/approve' do
    it 'bloqueia auto-aprovação pelo mesmo usuário que solicitou' do
      post "/api/v1/mcp/approvals/#{approval1.request_uuid}/approve", headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:forbidden)

      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('self_approval_forbidden')
    end

    it 'permite aprovação por outro administrador' do
      post "/api/v1/mcp/approvals/#{approval1.request_uuid}/approve", headers: { 'Authorization' => "Bearer #{other_admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['ok']).to be true
      expect(json['status']).to eq('approved')

      approval1.reload
      expect(approval1.status).to eq('approved')
      expect(approval1.approved_by_user_id).to eq(other_admin.id)
    end
  end

  describe 'POST /api/v1/mcp/approvals/:request_uuid/reject' do
    it 'permite rejeição com motivo de auditoria' do
      post "/api/v1/mcp/approvals/#{approval2.request_uuid}/reject",
           params: { reason: 'Dados incompletos da empresa.' },
           headers: { 'Authorization' => "Bearer #{admin_token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['status']).to eq('rejected')

      approval2.reload
      expect(approval2.status).to eq('rejected')
      expect(approval2.rejection_reason).to eq('Dados incompletos da empresa.')
    end
  end

  describe 'POST /api/v1/mcp/approvals/:request_uuid/snooze' do
    it 'permite snooze com data futura' do
      until_time = 3.hours.from_now.iso8601
      post "/api/v1/mcp/approvals/#{approval1.request_uuid}/snooze",
           params: { until: until_time, reason: 'Adiado para após o almoço' },
           headers: { 'Authorization' => "Bearer #{admin_token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['ok']).to be true
      expect(json['data']['snoozed']).to be true

      approval1.reload
      expect(approval1.snoozed?).to be true
    end
  end

  describe 'POST /api/v1/mcp/approvals/:request_uuid/execute' do
    it 'executa a solicitação se estiver aprovada' do
      approval1.approve!(user: other_admin)

      post "/api/v1/mcp/approvals/#{approval1.request_uuid}/execute",
           params: { force_sync: true },
           headers: { 'Authorization' => "Bearer #{admin_token}" }

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['ok']).to be true
      expect(json['data']['status']).to eq('executed')

      approval1.reload
      expect(approval1.status).to eq('executed')
    end
  end

  describe 'GET /api/v1/mcp/approvals/:request_uuid/events' do
    it 'retorna timeline de eventos da solicitação' do
      get "/api/v1/mcp/approvals/#{approval1.request_uuid}/events", headers: { 'Authorization' => "Bearer #{admin_token}" }
      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      expect(json['events']).to be_an(Array)
      expect(json['events'].first['event_type']).to eq('mcp.approval.requested')
    end
  end
end
