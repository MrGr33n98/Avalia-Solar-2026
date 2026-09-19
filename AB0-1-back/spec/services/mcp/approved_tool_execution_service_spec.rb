# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Mcp::ApprovedToolExecutionService do
  let(:company) { FactoryBot.create(:company, name: 'Solar Power Ltd') }
  let(:requester) do
    User.create!(
      name: 'Requester User',
      email: 'req_exec@avaliasolar.com.br',
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
      email: 'app_exec@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:approval) do
    McpApprovalRequest.create!(
      agent_id: 'agent:engineering:primary',
      tool_name: 'search_companies',
      risk_tier: 'r0',
      tenant_id: company.id,
      requested_by_user_id: requester.id,
      parameters_payload: { 'query' => 'Solar' }
    )
  end

  describe '#call' do
    it 'falha se a solicitação ainda estiver pendente (sem aprovação prévia)' do
      expect do
        described_class.new(request_uuid: approval.request_uuid, user: approver).call
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('approval_not_ready')
      end
    end

    it 'executa com sucesso quando aprovada e despacha para o domain service correspondente' do
      approval.approve!(user: approver)

      result = described_class.new(
        request_uuid: approval.request_uuid,
        user: approver,
        force_sync: true
      ).call

      expect(result[:status]).to eq('executed')
      expect(result[:data]).to be_present
      expect(result[:execution_id]).to be_present

      approval.reload
      expect(approval.status).to eq('executed')
      expect(approval.execution_id).to eq(result[:execution_id])
    end

    it 'enfileira job Sidekiq quando configurado para execução assíncrona' do
      approval.update_columns(tool_name: 'send_outbound_campaign', risk_tier: 'r3')
      # recalcular digest
      digest = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: approval.agent_id,
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: approval.parameters_payload,
        requester_user_id: approval.requested_by_user_id,
        tenant_id: approval.tenant_id
      )
      approval.update_columns(payload_digest: digest)
      approval.approve!(user: approver)

      expect do
        result = described_class.new(
          request_uuid: approval.request_uuid,
          user: approver,
          force_sync: false
        ).call

        expect(result[:status]).to eq('queued')
        expect(result[:async]).to be true
      end.to have_enqueued_job(Mcp::ExecuteApprovedToolJob)
    end
  end
end
