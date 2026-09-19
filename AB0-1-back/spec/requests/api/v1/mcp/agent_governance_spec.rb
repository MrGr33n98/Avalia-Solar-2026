# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP Agent Identity, Governance & HITL Protocol API', type: :request do
  def jwt_token_for(user)
    JWT.encode({ user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid }, Rails.application.secret_key_base, 'HS256')
  end

  def agent_key_header_for(agent_id)
    return {} unless agent_id.present?

    cred, secret = McpAgentCredential.generate_for_agent!(agent_id: agent_id)
    { 'X-Agent-Key' => "#{cred.key_id}:#{secret}" }
  end

  def auth_headers(user, agent_id = nil)
    headers = {
      'Authorization' => "Bearer #{jwt_token_for(user)}",
      'Accept' => 'application/json'
    }
    if agent_id.present?
      headers['X-Agent-Id'] = agent_id
      headers.merge!(agent_key_header_for(agent_id))
    end
    headers
  end

  let!(:company_alpha) { FactoryBot.create(:company, name: 'Alpha Solar Ltda') }
  let!(:company_beta) { FactoryBot.create(:company, name: 'Beta Solar Ltda') }

  let!(:admin_user) do
    User.create!(
      name: 'Governance Admin',
      email: 'admin_gov@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      confirmed_at: Time.current
    )
  end

  let!(:approver_admin) do
    User.create!(
      name: 'Approver Admin',
      email: 'approver_admin@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      confirmed_at: Time.current
    )
  end

  let!(:company_user) do
    user = User.create!(
      name: 'Alpha Owner',
      email: 'owner@alphasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'company',
      company: company_alpha,
      confirmed_at: Time.current
    )
    CompanyMember.create!(company: company_alpha, user: user, role: :owner, status: :active)
    user
  end

  describe '1. Hard Prohibited Tools Gate' do
    it 'DENY: Arbitrary SQL query attempt is blocked before execution with 403' do
      post '/api/v1/mcp/tools/execute_sql',
           params: { arguments: { query: 'SELECT * FROM users;' } },
           headers: auth_headers(admin_user, 'agent:engineering:primary')

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(false)
      expect(body['error']['code']).to eq('prohibited_tool')
      expect(body['error']['message']).to match(/proibida/)
    end

    it 'DENY: Shell command attempt is blocked before execution with 403' do
      post '/api/v1/mcp/tools/exec_shell',
           params: { arguments: { command: 'cat /etc/passwd' } },
           headers: auth_headers(admin_user, 'agent:engineering:primary')

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']['code']).to eq('prohibited_tool')
    end
  end

  describe '2. Agent Whitelist & Least Privilege Enforcing' do
    it 'ALLOW: Observability Agent executes diagnose_performance with R0 classification and metadata' do
      post '/api/v1/mcp/tools/diagnose_performance',
           params: { arguments: { window_minutes: 15 } },
           headers: auth_headers(admin_user, 'agent:observability:primary')

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['tool']).to eq('diagnose_performance')
      expect(body['meta']['agent_id']).to eq('agent:observability:primary')
      expect(body['meta']['risk_tier']).to eq('r0')
    end

    it 'DENY: Observability Agent is blocked from executing modifying tools not in its whitelist' do
      post '/api/v1/mcp/tools/create_review_request',
           params: { arguments: { company_id: company_alpha.id, customer_email: 'client@test.com' } },
           headers: auth_headers(admin_user, 'agent:observability:primary')

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(false)
      expect(body['error']['code']).to eq('tool_not_allowed_for_agent')
    end

    it 'ALLOW: Hermes Growth Agent executes recommend_next_actions (R1)' do
      post '/api/v1/mcp/tools/recommend_next_actions',
           params: { arguments: { company_id: company_alpha.id } },
           headers: auth_headers(admin_user, 'agent:hermes:outbound')

      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(true)
      expect(body['meta']['agent_id']).to eq('agent:hermes:outbound')
      expect(body['meta']['risk_tier']).to eq('r1')
    end
  end

  describe '3. Multi-Tenant Context Isolation' do
    it 'DENY: Scoped tenant agent is blocked from accessing another company data' do
      scoped_agent = AgentIdentity.new(
        agent_id: 'agent:custom:alpha',
        name: 'Alpha Scoped Agent',
        agent_type: :support,
        scopes: %w[mcp:read mcp:write],
        allowed_tools: %w[get_leads_summary],
        risk_tier_max: :r2,
        tenant_id: company_alpha.id
      )
      allow(AgentIdentity).to receive(:find).with('agent:custom:alpha').and_return(scoped_agent)

      post '/api/v1/mcp/tools/get_leads_summary',
           params: { arguments: { company_id: company_beta.id } },
           headers: auth_headers(admin_user, 'agent:custom:alpha')

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']['code']).to eq('cross_tenant_violation')
    end
  end

  describe '4. Human-in-the-Loop (HITL) Complete Lifecycle' do
    it 'TRIGGERS HITL GATE: R3 mutation generates pending approval request and 202 Accepted' do
      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: { arguments: { campaign_name: 'Summer Outreach 2026', recipient_count: 250 } },
           headers: auth_headers(admin_user, 'agent:engineering:primary')

      expect(response).to have_http_status(:accepted)
      body = JSON.parse(response.body)
      expect(body['ok']).to be(false)
      expect(body['error']['code']).to eq('hitl_approval_required')
      expect(body['error']['details']['status']).to eq('pending')
      expect(body['error']['details']['risk_tier']).to eq('r3')

      approval_uuid = body['error']['details']['approval_request_id']
      expect(approval_uuid).to be_present

      request_record = McpApprovalRequest.find_by(request_uuid: approval_uuid)
      expect(request_record).to be_present
      expect(request_record.status).to eq('pending')
      expect(request_record.tool_name).to eq('send_outbound_campaign')

      # Simulação de aprovação por operador humano independente (anti-auto-aprovação)
      request_record.approve!(user: approver_admin)

      # Reenvio com o approval_request_id aprovado
      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: {
             approval_request_id: approval_uuid,
             arguments: { campaign_name: 'Summer Outreach 2026', recipient_count: 250 }
           },
           headers: auth_headers(admin_user, 'agent:engineering:primary')

      expect(response).to have_http_status(:ok)
      exec_body = JSON.parse(response.body)
      expect(exec_body['ok']).to be(true)
      expect(exec_body['data']['status']).to eq('queued')
      expect(exec_body['data']['dispatched_recipients']).to eq(250)
      expect(exec_body['data']['governance']['hitl_validated']).to be(true)

      expect(request_record.reload.status).to eq('executed')
    end

    it 'DENY: Rejects execution if human operator rejected the request' do
      request_record = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        status: 'pending'
      )
      request_record.reject!(user: admin_user, reason: 'Disparo de marketing fora do horário permitido.')

      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: {
             approval_request_id: request_record.request_uuid,
             arguments: { campaign_name: 'Summer Outreach 2026' }
           },
           headers: auth_headers(admin_user, 'agent:engineering:primary')

      expect(response).to have_http_status(:forbidden)
      body = JSON.parse(response.body)
      expect(body['error']['code']).to eq('hitl_rejected')
      expect(body['error']['message']).to match(/fora do horário permitido/)
    end
  end
end
