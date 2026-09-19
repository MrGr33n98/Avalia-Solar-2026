# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::AgentAuthorizationService do
  let!(:company_a) { FactoryBot.create(:company, name: 'Solar Alpha Ltda') }
  let!(:company_b) { FactoryBot.create(:company, name: 'Solar Beta Ltda') }

  let!(:admin_user) do
    User.create!(
      name: 'Governance Admin',
      email: 'gov_admin@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      confirmed_at: Time.current
    )
  end

  let!(:company_user) do
    user = User.create!(
      name: 'Solar Alpha Manager',
      email: 'manager@solaralpha.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'company',
      company: company_a,
      confirmed_at: Time.current
    )
    CompanyMember.create!(company: company_a, user: user, role: :owner, status: :active)
    user
  end

  describe 'Hard Prohibited Tools Gate' do
    it 'DENY: Raises prohibited_tool error on arbitrary SQL attempts' do
      expect do
        described_class.authorize!(
          tool_name: 'execute_sql',
          arguments: { query: 'SELECT * FROM users' },
          headers: { 'X-Agent-Id' => 'agent:engineering:primary' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('prohibited_tool')
        expect(e.status).to eq(:forbidden)
      }
    end

    it 'DENY: Raises prohibited_tool error on shell exec attempts' do
      expect do
        described_class.authorize!(
          tool_name: 'exec_shell',
          arguments: { command: 'ls -la' },
          headers: { 'X-Agent-Id' => 'agent:engineering:primary' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('prohibited_tool')
      }
    end
  end

  describe 'Agent Whitelist & Scope Validation' do
    it 'ALLOW: Observability agent can execute get_system_health' do
      result = described_class.authorize!(
        tool_name: 'get_system_health',
        arguments: {},
        headers: { 'X-Agent-Id' => 'agent:observability:primary' }
      )

      expect(result[:authorized]).to be(true)
      expect(result[:agent].agent_id).to eq('agent:observability:primary')
      expect(result[:risk_tier]).to eq(:r0)
    end

    it 'DENY: Observability agent is blocked from executing mutating tools' do
      expect do
        described_class.authorize!(
          tool_name: 'create_review_request',
          arguments: { company_id: company_a.id },
          headers: { 'X-Agent-Id' => 'agent:observability:primary' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('tool_not_allowed_for_agent')
        expect(e.status).to eq(:forbidden)
      }
    end

    it 'ALLOW: Hermes agent can execute recommend_next_actions (R1)' do
      result = described_class.authorize!(
        tool_name: 'recommend_next_actions',
        arguments: { company_id: company_a.id },
        headers: { 'X-Agent-Id' => 'agent:hermes:outbound' }
      )

      expect(result[:authorized]).to be(true)
      expect(result[:risk_tier]).to eq(:r1)
    end

    it 'DENY: Hermes agent cannot execute R2 tools (exceeds R1 max tier)' do
      expect do
        described_class.authorize!(
          tool_name: 'create_review_request',
          arguments: { company_id: company_a.id },
          headers: { 'X-Agent-Id' => 'agent:hermes:outbound' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('tool_not_allowed_for_agent')
      }
    end
  end

  describe 'Multi-Tenant Isolation' do
    it 'DENY: Tenant-scoped agent cannot access another company data' do
      scoped_agent = AgentIdentity.new(
        agent_id: 'agent:custom:tenant_alpha',
        name: 'Alpha Scoped Agent',
        agent_type: :support,
        scopes: %w[mcp:read mcp:write],
        allowed_tools: %w[get_leads_summary],
        risk_tier_max: :r2,
        tenant_id: company_a.id
      )
      allow(AgentIdentity).to receive(:find).with('agent:custom:tenant_alpha').and_return(scoped_agent)

      expect do
        described_class.authorize!(
          tool_name: 'get_leads_summary',
          arguments: { company_id: company_b.id },
          headers: { 'X-Agent-Id' => 'agent:custom:tenant_alpha' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('cross_tenant_violation')
        expect(e.status).to eq(:forbidden)
      }
    end

    it 'ALLOW: Tenant-scoped agent accessing its own company data passes tenant check' do
      scoped_agent = AgentIdentity.new(
        agent_id: 'agent:custom:tenant_alpha',
        name: 'Alpha Scoped Agent',
        agent_type: :support,
        scopes: %w[mcp:read mcp:write],
        allowed_tools: %w[get_leads_summary],
        risk_tier_max: :r2,
        tenant_id: company_a.id
      )
      allow(AgentIdentity).to receive(:find).with('agent:custom:tenant_alpha').and_return(scoped_agent)

      result = described_class.authorize!(
        tool_name: 'get_leads_summary',
        arguments: { company_id: company_a.id },
        headers: { 'X-Agent-Id' => 'agent:custom:tenant_alpha' }
      )

      expect(result[:authorized]).to be(true)
    end
  end

  describe 'Human-in-the-Loop (HITL) Protocol' do
    it 'CREATES HITL REQUEST: High-impact R3 action raises hitl_approval_required and records pending request' do
      expect do
        described_class.authorize!(
          tool_name: 'send_outbound_campaign',
          arguments: { campaign_name: 'Q3 Solar Blast', recipient_count: 500 },
          user: admin_user,
          headers: { 'X-Agent-Id' => 'agent:engineering:primary' }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('hitl_approval_required')
        expect(e.status).to eq(:accepted)
        expect(e.details).to have_key(:approval_request_id)
        expect(e.details[:status]).to eq('pending')

        req = McpApprovalRequest.find_by(request_uuid: e.details[:approval_request_id])
        expect(req).to be_present
        expect(req.tool_name).to eq('send_outbound_campaign')
        expect(req.risk_tier).to eq('r3')
        expect(req.status).to eq('pending')
      }
    end

    it 'DENY: Raises hitl_rejected when approval request was rejected by human operator' do
      approval_req = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        status: 'pending'
      )
      approval_req.reject!(user: admin_user, reason: 'Budget limit reached for outbound messaging.')

      expect do
        described_class.authorize!(
          tool_name: 'send_outbound_campaign',
          arguments: { campaign_name: 'Q3 Solar Blast' },
          user: admin_user,
          headers: { 'X-Agent-Id' => 'agent:engineering:primary' },
          params: { approval_request_id: approval_req.request_uuid }
        )
      end.to raise_error(Mcp::Error) { |e|
        expect(e.code).to eq('hitl_rejected')
        expect(e.status).to eq(:forbidden)
        expect(e.message).to include('Budget limit reached')
      }
    end

    it 'ALLOW: Grants execution when approval request is approved by human operator' do
      approval_req = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        status: 'pending'
      )
      approval_req.approve!(user: admin_user)

      result = described_class.authorize!(
        tool_name: 'send_outbound_campaign',
        arguments: { campaign_name: 'Q3 Solar Blast' },
        user: admin_user,
        headers: { 'X-Agent-Id' => 'agent:engineering:primary' },
        params: { approval_request_id: approval_req.request_uuid }
      )

      expect(result[:authorized]).to be(true)
      expect(approval_req.reload.status).to eq('executed')
    end
  end
end
