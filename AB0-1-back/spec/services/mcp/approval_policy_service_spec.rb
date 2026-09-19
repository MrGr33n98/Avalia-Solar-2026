# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::ApprovalPolicyService do
  let(:company) { FactoryBot.create(:company, name: 'Solar Corp') }
  let(:admin_user) do
    User.create!(
      name: 'Admin User',
      email: 'admin_pol@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:sales_user) do
    User.create!(
      name: 'Sales Rep',
      email: 'sales_pol@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'user',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:requester) do
    User.create!(
      name: 'Requester User',
      email: 'req_pol@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:r3_request) do
    McpApprovalRequest.create!(
      agent_id: 'agent:engineering:primary',
      tool_name: 'send_outbound_campaign',
      risk_tier: 'r3',
      tenant_id: company.id,
      requested_by_user_id: requester.id,
      parameters_payload: { 'campaign_id' => 123 }
    )
  end

  let(:r4_request) do
    McpApprovalRequest.create!(
      agent_id: 'agent:engineering:primary',
      tool_name: 'charge_subscription',
      risk_tier: 'r4',
      tenant_id: company.id,
      requested_by_user_id: requester.id,
      parameters_payload: { 'amount' => 5000 }
    )
  end

  describe '.requires_approval?' do
    it 'retorna false para ferramentas R0 (Safe Read)' do
      expect(described_class.requires_approval?(tool_name: 'search_companies')).to be false
      expect(described_class.requires_approval?(tool_name: 'get_system_health')).to be false
    end

    it 'retorna false para ferramentas R1 (Analysis/Draft)' do
      expect(described_class.requires_approval?(tool_name: 'recommend_next_actions')).to be false
    end

    it 'retorna true para ferramentas R3 (External Mutation)' do
      expect(described_class.requires_approval?(tool_name: 'send_outbound_campaign')).to be true
      expect(described_class.requires_approval?(tool_name: 'bulk_lead_export')).to be true
    end

    it 'retorna true para ferramentas R4 (Critical/Financial)' do
      expect(described_class.requires_approval?(tool_name: 'charge_subscription')).to be true
      expect(described_class.requires_approval?(tool_name: 'delete_tenant_data')).to be true
    end
  end

  describe '.can_user_approve?' do
    it 'permite que outro administrador aprove requisições R3 e R4' do
      expect(described_class.can_user_approve?(user: admin_user, approval_request: r3_request)).to be true
      expect(described_class.can_user_approve?(user: admin_user, approval_request: r4_request)).to be true
    end

    it 'bloqueia o próprio solicitante mesmo sendo admin (Anti-Self-Approval)' do
      expect(described_class.can_user_approve?(user: requester, approval_request: r3_request)).to be false
      expect(described_class.can_user_approve?(user: requester, approval_request: r4_request)).to be false
    end

    it 'bloqueia usuário padrão sem privilégios' do
      expect(described_class.can_user_approve?(user: sales_user, approval_request: r3_request)).to be false
      expect(described_class.can_user_approve?(user: sales_user, approval_request: r4_request)).to be false
    end
  end

  describe '.execution_policy' do
    it 'classifica mutações externas não idempotentes com necessidade de intervenção' do
      policy = described_class.execution_policy(tool_name: 'send_outbound_campaign')
      expect(policy[:effect_type]).to eq('NON_IDEMPOTENT_EXTERNAL_MUTATION')
      expect(policy[:async_execution_recommended]).to be true
    end

    it 'classifica mutações em banco como idempotency proven' do
      policy = described_class.execution_policy(tool_name: 'search_companies')
      expect(policy[:effect_type]).to eq('DATABASE_MUTATION')
      expect(policy[:idempotency_proven]).to be true
    end
  end
end
