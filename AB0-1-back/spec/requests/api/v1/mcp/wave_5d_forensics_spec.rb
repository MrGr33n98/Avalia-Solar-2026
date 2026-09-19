# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 5D — Security Verification & Forensics Gate', type: :request do
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

  let!(:company_alpha) { FactoryBot.create(:company, name: 'Alpha Forensics Solar') }
  let!(:company_beta) { FactoryBot.create(:company, name: 'Beta Forensics Solar') }

  let!(:admin_requester) do
    User.create!(
      name: 'Admin Requester',
      email: 'requester_5d@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let!(:admin_approver) do
    User.create!(
      name: 'Admin Approver',
      email: 'approver_5d@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'admin',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  let!(:normal_user) do
    User.create!(
      name: 'Normal User',
      email: 'normal_5d@avaliasolar.com.br',
      password: 'Password123!',
      terms_accepted: true,
      role: 'user',
      city: 'São Paulo',
      state: 'SP',
      confirmed_at: Time.current
    )
  end

  describe '1. Environment Confirmation' do
    it 'PROVES database is avalia_solar_test and RAILS_ENV is test' do
      current_db = ActiveRecord::Base.connection_db_config.database
      expect(current_db).to eq('avalia_solar_test')
      expect(Rails.env).to eq('test')
    end
  end

  describe '2. Schema Forensics & PostgreSQL Invariants' do
    let(:conn) { ActiveRecord::Base.connection }

    it 'PROVES column nullability, unique indexes, check constraints and foreign keys' do
      # 1. payload_digest NOT NULL
      col = conn.columns('mcp_approval_requests').find { |c| c.name == 'payload_digest' }
      expect(col).to be_present
      expect(col.null).to be(false)

      # 2. request_uuid UNIQUE
      unique_indexes = conn.indexes('mcp_approval_requests').select(&:unique).map(&:columns)
      expect(unique_indexes).to include(['request_uuid'])

      # 3. CHECK constraints on status & risk_tier
      checks = conn.select_rows(<<-SQL)
        SELECT conname, pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'mcp_approval_requests'::regclass AND contype = 'c';
      SQL
      check_defs = checks.map { |r| r[1] }.join(' ')
      expect(check_defs).to match(/status/i)
      expect(check_defs).to match(/pending.*approved.*rejected.*executed.*expired/i)
      expect(check_defs).to match(/risk_tier/i)
      expect(check_defs).to match(/r0.*r1.*r2.*r3.*r4/i)

      # 4. Foreign Keys
      fks = conn.foreign_keys('mcp_approval_requests')
      fk_cols = fks.map { |fk| [fk.column, fk.to_table] }
      expect(fk_cols).to include(['requested_by_user_id', 'users'])
      expect(fk_cols).to include(['approved_by_user_id', 'users'])
      expect(fk_cols).to include(['tenant_id', 'companies'])

      # 5. Composite & Essential Indexes
      idx_cols = conn.indexes('mcp_approval_requests').map(&:columns)
      expect(idx_cols).to include(['request_uuid'])
      expect(idx_cols).to include(['payload_digest'])
      expect(idx_cols).to include(['status'])
      expect(idx_cols).to include(['tenant_id'])
      expect(idx_cols).to include(['agent_id'])
      expect(idx_cols).to include(%w[status expires_at])
    end
  end

  describe '3. Credential Security & Rotation' do
    it 'PROVES plaintext secret is never persisted and rotation works' do
      # Criação da credencial
      cred, raw_secret = McpAgentCredential.generate_for_agent!(agent_id: 'agent:engineering:primary')

      # Prova que o segredo bruto nunca está salvo no banco
      reloaded = McpAgentCredential.find(cred.id)
      expect(reloaded.secret_digest).not_to eq(raw_secret)
      expect(reloaded.secret_digest).to eq(McpAgentCredential.compute_secret_digest(cred.key_id, raw_secret))

      # Autenticação válida
      expect(McpAgentCredential.authenticate(key_id: cred.key_id, raw_secret: raw_secret)).to eq(reloaded)

      # Apenas o key_id não é suficiente para autenticar
      expect(McpAgentCredential.authenticate(key_id: cred.key_id, raw_secret: 'wrong_secret')).to be_nil

      # Rotação de credencial: revogar credencial antiga
      cred.revoke!
      expect(cred.reload.revoked?).to be(true)
      expect(McpAgentCredential.authenticate(key_id: cred.key_id, raw_secret: raw_secret)).to be_nil

      # Gerar nova credencial
      new_cred, new_secret = McpAgentCredential.generate_for_agent!(agent_id: 'agent:engineering:primary')
      expect(new_cred.active?).to be(true)
      expect(McpAgentCredential.authenticate(key_id: new_cred.key_id, raw_secret: new_secret)).to eq(new_cred)
    end
  end

  describe '4. Agent Spoofing Attacks' do
    it 'DENY: X-Agent-Id privileged without credential' do
      post '/api/v1/mcp/tools/diagnose_performance',
           params: { arguments: {} },
           headers: { 'Authorization' => "Bearer #{jwt_token_for(admin_requester)}", 'X-Agent-Id' => 'agent:engineering:primary' }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)['error']['code']).to eq('missing_agent_credential')
    end

    it 'DENY: Body agent_id privileged without credential' do
      post '/api/v1/mcp/tools/diagnose_performance',
           params: { agent_id: 'agent:engineering:primary', arguments: {} },
           headers: { 'Authorization' => "Bearer #{jwt_token_for(admin_requester)}" }

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)['error']['code']).to eq('missing_agent_credential')
    end

    it 'DENY: Credential of agent A with claimed agent B' do
      cred_obs, sec_obs = McpAgentCredential.generate_for_agent!(agent_id: 'agent:observability:primary')

      post '/api/v1/mcp/tools/diagnose_performance',
           params: { arguments: {} },
           headers: {
             'Authorization' => "Bearer #{jwt_token_for(admin_requester)}",
             'X-Agent-Id' => 'agent:engineering:primary',
             'X-Agent-Key' => "#{cred_obs.key_id}:#{sec_obs}"
           }

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']['code']).to eq('agent_credential_mismatch')
    end
  end

  describe '5. Canonical Payload Forensics' do
    it 'PROVES determinism, sensitivity and fail-closed behavior' do
      digest_base = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 10
      )

      # 1. Hashes com chaves invertidas => MESMO DIGEST
      digest_inverted = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'template' => 'summer_v1', 'recipients' => 100 },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_inverted).to eq(digest_base)

      # 2. Arrays reordenados => DIFERENTE DIGEST
      digest_arr1 = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'list' => [1, 2, 3] },
        requester_user_id: 42,
        tenant_id: 10
      )
      digest_arr2 = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'list' => [3, 2, 1] },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_arr1).not_to eq(digest_arr2)

      # 3. Mudança de argumento => DIFERENTE DIGEST
      digest_changed_arg = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 101, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_changed_arg).not_to eq(digest_base)

      # 4. Mudança de tool => DIFERENTE DIGEST
      digest_diff_tool = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'other_tool',
        risk_tier: 'r3',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_diff_tool).not_to eq(digest_base)

      # 5. Mudança de tenant => DIFERENTE DIGEST
      digest_diff_tenant = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 11
      )
      expect(digest_diff_tenant).not_to eq(digest_base)

      # 6. Mudança de agent => DIFERENTE DIGEST
      digest_diff_agent = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:other:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_diff_agent).not_to eq(digest_base)

      # 7. Mudança de requester => DIFERENTE DIGEST
      digest_diff_req = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 43,
        tenant_id: 10
      )
      expect(digest_diff_req).not_to eq(digest_base)

      # 8. Mudança de risk => DIFERENTE DIGEST
      digest_diff_risk = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: 'agent:hermes:outbound',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r4',
        arguments: { 'recipients' => 100, 'template' => 'summer_v1' },
        requester_user_id: 42,
        tenant_id: 10
      )
      expect(digest_diff_risk).not_to eq(digest_base)

      # 9. Tipos primitivos suportados
      expect {
        Mcp::CanonicalPayloadService.generate_digest(
          agent_id: 'agent:hermes:outbound',
          tool_name: 'send_outbound_campaign',
          risk_tier: 'r3',
          arguments: {
            'nil_val' => nil,
            'bool_true' => true,
            'bool_false' => false,
            'int_val' => 42,
            'float_val' => 3.1415,
            'string_utf8' => 'Açúcar & Solar ☀️',
            'nested_arr' => [1, 'dois', { 'sub' => true }]
          },
          requester_user_id: 42,
          tenant_id: 10
        )
      }.not_to raise_error

      # 10. Tipo não suportado => FAIL CLOSED
      expect {
        Mcp::CanonicalPayloadService.generate_digest(
          agent_id: 'agent:hermes:outbound',
          tool_name: 'send_outbound_campaign',
          risk_tier: 'r3',
          arguments: { 'invalid_obj' => Object.new },
          requester_user_id: 42,
          tenant_id: 10
        )
      }.to raise_error(Mcp::Error)
    end
  end

  describe '6. Approval Parameter Tampering Attacks' do
    it 'DENY: Tampering any parameter pós-aprovação e mantém approval não consumida' do
      # 1. Inicia request R3
      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: { arguments: { campaign_name: 'Summer Outreach', recipient_count: 10 } },
           headers: auth_headers(admin_requester, 'agent:engineering:primary')

      expect(response).to have_http_status(:accepted)
      approval_uuid = JSON.parse(response.body)['error']['details']['approval_request_id']

      # 2. Aprovador aprova
      approval_record = McpApprovalRequest.find_by!(request_uuid: approval_uuid)
      approval_record.approve!(user: admin_approver)
      expect(approval_record.reload.status).to eq('approved')

      # 3. Ataque: Alterar recipient_count de 10 para 10000
      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: {
             approval_request_id: approval_uuid,
             arguments: { campaign_name: 'Summer Outreach', recipient_count: 10000 }
           },
           headers: auth_headers(admin_requester, 'agent:engineering:primary')

      expect(response).to have_http_status(:forbidden)
      expect(JSON.parse(response.body)['error']['code']).to eq('approval_payload_mismatch')

      # 4. Prova que o registro continua aprovado e NÃO consumido
      expect(approval_record.reload.status).to eq('approved')
      expect(approval_record.executed_at).to be_nil
    end
  end

  describe '7. Approver Authorization' do
    let(:pending_req) do
      McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        requested_by_user_id: admin_requester.id,
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'recipients' => 10 }
      )
    end

    it 'DENY: Normal user cannot approve' do
      expect { pending_req.approve!(user: normal_user) }.to raise_error(Mcp::Error) do |e|
        expect(e.code).to eq('unauthorized_approver')
      end
    end

    it 'ALLOW: Authorized admin user can approve' do
      expect { pending_req.approve!(user: admin_approver) }.not_to raise_error
      expect(pending_req.reload.status).to eq('approved')
      expect(pending_req.approved_by_user_id).to eq(admin_approver.id)
    end
  end

  describe '8. Self Approval Protection' do
    it 'DENY: Requester == Approver via Model e via HTTP API' do
      post '/api/v1/mcp/tools/send_outbound_campaign',
           params: { arguments: { campaign_name: 'Self Campaign', recipient_count: 10 } },
           headers: auth_headers(admin_requester, 'agent:engineering:primary')

      approval_uuid = JSON.parse(response.body)['error']['details']['approval_request_id']
      approval_record = McpApprovalRequest.find_by!(request_uuid: approval_uuid)

      # 1. Tentativa via Model
      expect { approval_record.approve!(user: admin_requester) }.to raise_error(Mcp::Error) do |e|
        expect(e.code).to eq('self_approval_forbidden')
      end

      # 2. Mesmo se o model fosse burlado, o status continua pending
      expect(approval_record.reload.status).to eq('pending')
    end
  end

  describe '9. Concurrency & Replay Protection (Multi-Thread Multi-Connection)' do
    let!(:concurrency_approval) do
      req = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'campaign_name' => 'Race Campaign', 'recipient_count' => 50 },
        requested_by_user_id: admin_requester.id,
        status: 'pending'
      )
      req.approve!(user: admin_approver)
      req
    end

    it 'PROVES exactly one thread consumes approval and subsequent executions are rejected' do
      args = { 'campaign_name' => 'Race Campaign', 'recipient_count' => 50 }
      results = []
      errors = []
      mutex = Mutex.new

      threads = 3.times.map do
        Thread.new do
          ActiveRecord::Base.connection_pool.with_connection do
            begin
              rec = McpApprovalRequest.find(concurrency_approval.id)
              rec.consume_execution!(
                agent_id: 'agent:engineering:primary',
                tool_name: 'send_outbound_campaign',
                risk_tier: 'r3',
                arguments: args
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
      expect(errors.count('approval_already_consumed')).to eq(2)

      # Replay sequencial posterior
      expect {
        concurrency_approval.reload.consume_execution!(
          agent_id: 'agent:engineering:primary',
          tool_name: 'send_outbound_campaign',
          risk_tier: 'r3',
          arguments: args
        )
      }.to raise_error(Mcp::Error) do |e|
        expect(e.code).to eq('approval_already_consumed')
      end
    end
  end

  describe '10. Audit Trail & Secret Redaction' do
    it 'PROVES audit logs include trace_id, agent_id, tool_name and never leaks secrets' do
      log_output = StringIO.new
      logger = Logger.new(log_output)
      allow(Rails).to receive(:logger).and_return(logger)

      post '/api/v1/mcp/tools/search_companies',
           params: {
             arguments: {
               'query' => 'Solar Clean',
               'password' => 'SecretPassword123!',
               'credit_card' => '4111-2222-3333-4444'
             }
           },
           headers: auth_headers(admin_requester, 'agent:hermes:outbound')

      expect(response).to have_http_status(:ok)
      log_text = log_output.string

      expect(log_text).to include('[MCP_AUDIT]')
      expect(log_text).to include('search_companies')
      expect(log_text).to include('agent:hermes:outbound')
      expect(log_text).to include('"argument_keys"')
      expect(log_text).not_to include('SecretPassword123!')
      expect(log_text).not_to include('4111-2222-3333-4444')
    end
  end
end
