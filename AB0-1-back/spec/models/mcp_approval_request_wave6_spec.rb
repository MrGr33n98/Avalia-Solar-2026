# frozen_string_literal: true

require 'rails_helper'

RSpec.describe McpApprovalRequest, type: :model do
  let(:company) { FactoryBot.create(:company, name: 'Solar Corp') }
  let(:requester) do
    User.create!(
      name: 'Requester User',
      email: 'req_w6@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:approver) do
    User.create!(
      name: 'Approver User',
      email: 'app_w6@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:other_user) do
    User.create!(
      name: 'Other User',
      email: 'other_w6@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'user',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:valid_attributes) do
    {
      agent_id: 'agent:engineering:primary',
      tool_name: 'send_outbound_campaign',
      risk_tier: 'r3',
      tenant_id: company.id,
      requested_by_user_id: requester.id,
      parameters_payload: { 'campaign_id' => 123, 'segment' => 'solar_b2b' }
    }
  end

  describe 'criação e defaults' do
    it 'gera request_uuid, requested_at, expires_at e payload_digest automaticamente' do
      approval = described_class.create!(valid_attributes)

      expect(approval.request_uuid).to be_present
      expect(approval.requested_at).to be_present
      expect(approval.expires_at).to be > approval.requested_at
      expect(approval.status).to eq('pending')
      expect(approval.payload_digest).to be_present
    end

    it 'emite DomainEvent mcp.approval.requested na criação' do
      expect do
        described_class.create!(valid_attributes)
      end.to change(DomainEvent, :count).by(1)

      last_event = DomainEvent.last
      expect(last_event.event_type).to eq('mcp.approval.requested')
      expect(last_event.payload['tool_name']).to eq('send_outbound_campaign')
    end
  end

  describe 'snooze e lifecycle' do
    let!(:approval) { described_class.create!(valid_attributes) }

    it 'permite snooze com data futura válida e emite DomainEvent' do
      target_time = 2.hours.from_now
      expect do
        approval.snooze!(user: approver, until_time: target_time, reason: 'Aguardar alinhamento com cliente')
      end.to change(DomainEvent, :count).by(1)

      approval.reload
      expect(approval.snoozed?).to be true
      expect(approval.snoozed_until).to be_within(2.seconds).of(target_time)
      expect(approval.metadata['snooze_reason']).to eq('Aguardar alinhamento com cliente')
    end

    it 'rejeita snooze com data no passado' do
      expect do
        approval.snooze!(user: approver, until_time: 1.hour.ago)
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('invalid_snooze_time')
      end
    end

    it 'permite remover snooze via unsnooze!' do
      approval.snooze!(user: approver, until_time: 2.hours.from_now)
      expect(approval.snoozed?).to be true

      approval.unsnooze!(user: approver)
      expect(approval.snoozed?).to be false
      expect(approval.snoozed_until).to be_nil
    end

    it 'garante que snooze não estende expires_at' do
      original_expires = approval.expires_at
      approval.snooze!(user: approver, until_time: 2.hours.from_now)

      expect(approval.expires_at).to eq(original_expires)
    end
  end

  describe 'segurança de aprovação (Anti-Self-Approval e RBAC)' do
    let!(:approval) { described_class.create!(valid_attributes) }

    it 'bloqueia auto-aprovação quando o solicitante tenta aprovar a própria requisição' do
      expect do
        approval.approve!(user: requester)
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('self_approval_forbidden')
      end
    end

    it 'permite que outro administrador aprove' do
      expect do
        approval.approve!(user: approver)
      end.to change(DomainEvent, :count).by(1)

      approval.reload
      expect(approval.status).to eq('approved')
      expect(approval.approved_by_user_id).to eq(approver.id)
    end

    it 'bloqueia usuário sem privilégios de governança' do
      expect do
        approval.approve!(user: other_user)
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('unauthorized_approver')
      end
    end

    it 'permite rejeição com motivo auditável' do
      expect do
        approval.reject!(user: approver, reason: 'Parâmetros fora da política comercial.')
      end.to change(DomainEvent, :count).by(1)

      approval.reload
      expect(approval.status).to eq('rejected')
      expect(approval.rejection_reason).to eq('Parâmetros fora da política comercial.')
    end
  end

  describe 'consumo exactly-once (consume_execution!)' do
    let(:approval) { described_class.create!(valid_attributes) }

    before do
      approval.approve!(user: approver)
    end

    it 'consome a aprovação com sucesso na primeira tentativa com parâmetros idênticos' do
      exec_id = approval.consume_execution!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'campaign_id' => 123, 'segment' => 'solar_b2b' },
        tenant_id: company.id
      )

      expect(exec_id).to be_present
      approval.reload
      expect(approval.status).to eq('executed')
      expect(approval.execution_id).to eq(exec_id)
      expect(approval.executed_at).to be_present
    end

    it 'bloqueia segunda tentativa com replay attack protection' do
      approval.consume_execution!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'campaign_id' => 123, 'segment' => 'solar_b2b' },
        tenant_id: company.id
      )

      expect do
        approval.consume_execution!(
          agent_id: 'agent:engineering:primary',
          tool_name: 'send_outbound_campaign',
          risk_tier: 'r3',
          arguments: { 'campaign_id' => 123, 'segment' => 'solar_b2b' },
          tenant_id: company.id
        )
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('approval_already_consumed')
      end
    end

    it 'bloqueia execução com argumentos adulterados (Tampering Protection)' do
      expect do
        approval.consume_execution!(
          agent_id: 'agent:engineering:primary',
          tool_name: 'send_outbound_campaign',
          risk_tier: 'r3',
          arguments: { 'campaign_id' => 999, 'segment' => 'solar_b2b' },
          tenant_id: company.id
        )
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('approval_payload_mismatch')
      end
    end
  end
end
