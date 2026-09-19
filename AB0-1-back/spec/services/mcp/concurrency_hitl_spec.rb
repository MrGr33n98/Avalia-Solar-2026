# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'McpApprovalRequest Concurrency & Exactly-Once Execution', type: :model do
  let!(:admin_user) do
    User.create!(
      name: 'Governance Admin',
      email: "gov_admin_#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'admin',
      terms_accepted: true,
      confirmed_at: Time.current
    )
  end

  let!(:requester_user) do
    User.create!(
      name: 'Agent Operator',
      email: "operator_#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'company',
      terms_accepted: true,
      confirmed_at: Time.current
    )
  end

  let!(:approval_request) do
    req = McpApprovalRequest.create!(
      agent_id: 'agent:hermes:outbound',
      tool_name: 'send_outbound_campaign',
      risk_tier: 'r3',
      parameters_payload: { 'recipients' => 10, 'template' => 'template_a' },
      requested_by_user_id: requester_user.id,
      status: 'pending'
    )
    req.approve!(user: admin_user)
    req
  end

  it 'garante que exatamente UMA execução concorrente consegue consumir a aprovação (Exactly-Once)' do
    threads_count = 5
    results = []
    errors = []
    mutex = Mutex.new

    threads = Array.new(threads_count) do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          begin
            req = McpApprovalRequest.find(approval_request.id)
            req.consume_execution!(
              agent_id: 'agent:hermes:outbound',
              tool_name: 'send_outbound_campaign',
              risk_tier: 'r3',
              arguments: { 'recipients' => 10, 'template' => 'template_a' }
            )
            mutex.synchronize { results << :success }
          rescue Mcp::Error => e
            mutex.synchronize { errors << e.code }
          end
        end
      end
    end

    threads.each(&:join)

    expect(results.count).to eq(1)
    expect(errors.count).to eq(threads_count - 1)
    expect(errors.all? { |c| c == 'approval_already_consumed' }).to be true

    approval_request.reload
    expect(approval_request.status).to eq('executed')
    expect(approval_request.executed_at).to be_present
  end
end
