# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'MCP Approval Concurrency & Race Condition Protection', type: :request do
  let(:company) { FactoryBot.create(:company, name: 'Concurrent Energy Corp') }
  let(:requester) do
    User.create!(
      name: 'Requester User',
      email: 'req_conc2@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:approver1) do
    User.create!(
      name: 'Approver 1',
      email: 'app1_conc2@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let(:approver2) do
    User.create!(
      name: 'Approver 2',
      email: 'app2_conc2@avaliasolar.com.br',
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
      tool_name: 'send_outbound_campaign',
      risk_tier: 'r3',
      tenant_id: company.id,
      requested_by_user_id: requester.id,
      parameters_payload: { 'campaign_id' => 999 }
    )
  end

  describe 'Concorrência de Consumo Exactly-Once (Two Executors racing to consume)' do
    before do
      approval.approve!(user: approver1)
    end

    it 'permite que apenas um executor consuma a aprovação e bloqueia o segundo por Replay Attack' do
      results = []
      errors = []
      threads = []

      2.times do |i|
        threads << Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            begin
              app_instance = McpApprovalRequest.find_by(request_uuid: approval.request_uuid)
              exec_id = app_instance.consume_execution!(
                agent_id: 'agent:engineering:primary',
                tool_name: 'send_outbound_campaign',
                risk_tier: 'r3',
                arguments: { 'campaign_id' => 999 },
                tenant_id: company.id,
                execution_id: "exec-concurrent-#{i}"
              )
              results << exec_id
            rescue Mcp::Error => e
              errors << e
            end
          end
        end
      end

      threads.each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(errors.first.code).to eq('approval_already_consumed')

      approval.reload
      expect(approval.status).to eq('executed')
      expect(approval.executed_at).to be_present
    end
  end

  describe 'Concorrência Aprovação vs Rejeição' do
    let(:pending_approval) do
      McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'charge_subscription',
        risk_tier: 'r4',
        tenant_id: company.id,
        requested_by_user_id: requester.id,
        parameters_payload: { 'amount' => 1000 }
      )
    end

    it 'determina um único vencedor canônico (aprovado ou rejeitado) sem inconsistência' do
      results = []
      errors = []
      threads = []

      threads << Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          begin
            app = McpApprovalRequest.find_by(request_uuid: pending_approval.request_uuid)
            app.approve!(user: approver1)
            results << 'approved'
          rescue Mcp::Error => e
            errors << e
          end
        end
      end

      threads << Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          begin
            app = McpApprovalRequest.find_by(request_uuid: pending_approval.request_uuid)
            app.reject!(user: approver2, reason: 'Conflito de decisão')
            results << 'rejected'
          rescue Mcp::Error => e
            errors << e
          end
        end
      end

      threads.each(&:join)

      expect(results.size).to eq(1)
      expect(errors.size).to eq(1)
      expect(%w[invalid_approval_state]).to include(errors.first.code)

      pending_approval.reload
      expect(%w[approved rejected]).to include(pending_approval.status)
    end
  end
end
