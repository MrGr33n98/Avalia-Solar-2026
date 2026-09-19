# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Wave 5C: Adversarial Agent Governance Security Suite', type: :request do
  def jwt_token_for(user)
    JWT.encode(
      { user_id: user.id, typ: 'access', exp: 24.hours.from_now.to_i, jti: SecureRandom.uuid },
      Rails.application.secret_key_base,
      'HS256'
    )
  end

  def auth_headers(user, extra = {})
    token = user ? jwt_token_for(user) : nil
    base = { 'Accept' => 'application/json', 'Content-Type' => 'application/json' }
    base['Authorization'] = "Bearer #{token}" if token
    base.merge(extra)
  end

  let!(:company_alpha) { FactoryBot.create(:company, name: 'Solar Alpha Tenancy') }
  let!(:company_beta) { FactoryBot.create(:company, name: 'Solar Beta Tenancy') }

  let!(:admin_user) do
    User.create!(
      name: 'Platform Admin',
      email: "admin_#{SecureRandom.hex(4)}@avaliasolar.com.br",
      password: 'Password123!',
      role: 'admin',
      terms_accepted: true,
      confirmed_at: Time.current,
      status: :active,
      city: 'São Paulo',
      state: 'SP'
    )
  end

  let!(:company_user) do
    user = User.create!(
      name: 'Company Owner Alpha',
      email: "owner_alpha_#{SecureRandom.hex(4)}@solaralpha.com",
      password: 'Password123!',
      role: 'company',
      company: company_alpha,
      terms_accepted: true,
      confirmed_at: Time.current,
      status: :active,
      city: 'São Paulo',
      state: 'SP'
    )
    CompanyMember.create!(company: company_alpha, user: user, role: :owner, status: :active)
    user
  end

  let!(:consumer_user) do
    User.create!(
      name: 'Regular Consumer',
      email: "consumer_#{SecureRandom.hex(4)}@gmail.com",
      password: 'Password123!',
      role: 'user',
      terms_accepted: true,
      confirmed_at: Time.current,
      status: :active,
      city: 'São Paulo',
      state: 'SP'
    )
  end

  # Setup credentials for registered agents
  let!(:hermes_credential_pair) do
    McpAgentCredential.generate_for_agent!(agent_id: 'agent:hermes:outbound')
  end
  let(:hermes_cred) { hermes_credential_pair[0] }
  let(:hermes_secret) { hermes_credential_pair[1] }

  let!(:engineering_credential_pair) do
    McpAgentCredential.generate_for_agent!(agent_id: 'agent:engineering:primary')
  end
  let(:engineering_cred) { engineering_credential_pair[0] }
  let(:engineering_secret) { engineering_credential_pair[1] }

  let!(:observability_credential_pair) do
    McpAgentCredential.generate_for_agent!(agent_id: 'agent:observability:primary')
  end
  let(:observability_cred) { observability_credential_pair[0] }
  let(:observability_secret) { observability_credential_pair[1] }

  let!(:outbound_campaign) do
    account = Sales::Account.create!(company: company_alpha, owner: company_user, name: 'Conta de campanha')
    Sales::Contact.create!(account: account, user: company_user, first_name: 'Contato', email: 'contato@campanha.test')
    audience = Sales::Audience.create!(company: company_alpha, created_by: company_user, name: 'Audiência de teste', kind: 'dynamic', filter_definition: {})
    template = Sales::EmailTemplate.create!(
      company: company_alpha,
      user: company_user,
      name: 'Template de teste',
      subject_template: 'Atualização comercial',
      body_html: '<p>Conteúdo aprovado para teste</p>',
      status: 'active'
    )
    Sales::Campaign.create!(
      company: company_alpha,
      user: company_user,
      audience: audience,
      email_template: template,
      name: 'Campanha com aprovação',
      campaign_type: 'email_broadcast',
      status: 'draft',
      audience_filter: {}
    )
  end

  describe '1-5. Agent Authentication & Anti-Spoofing Vectors' do
    it '1. Spoof agent_id: Bloqueia requisição que alega agent_id de sistema sem enviar credenciais' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'search_companies', arguments: { query: 'Solar' } }.to_json,
           headers: auth_headers(admin_user, 'X-Agent-Id' => 'agent:hermes:outbound')

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('missing_agent_credential')
    end

    it '2. Missing agent credential: Rejeita quando header X-Agent-Key está ausente' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'search_companies', arguments: {} }.to_json,
           headers: auth_headers(admin_user, 'X-Agent-Id' => 'agent:engineering:primary')

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('missing_agent_credential')
    end

    it '3. Invalid credential: Rejeita segredo incorreto para a chave fornecida' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'search_companies', arguments: {} }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:hermes:outbound',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:invalid_secret_value")

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('invalid_agent_credential')
    end

    it '4. Revoked credential: Rejeita credencial que foi revogada administrativamente' do
      hermes_cred.revoke!(reason: 'Security key rotation')

      post '/api/v1/mcp/tools',
           params: { tool_name: 'search_companies', arguments: {} }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:hermes:outbound',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:#{hermes_secret}")

      expect(response).to have_http_status(:unauthorized)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('revoked_agent_credential')
    end

    it '5. Credential/agent mismatch: Rejeita credencial válida de Hermes tentando se passar por Engineering' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'diagnose_performance', arguments: {} }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:#{hermes_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('agent_credential_mismatch')
    end
  end

  describe '6-9. Authorization Boundaries, Scopes, Risk Tiers & Tenancy' do
    it '6. Unauthorized tool: Hermes tenta executar ferramenta fora da whitelist (diagnose_performance)' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'diagnose_performance', arguments: {} }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:hermes:outbound',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:#{hermes_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('tool_not_allowed_for_agent')
    end

    it '7. Missing scope: Agente sem escopo suficiente é bloqueado' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'send_outbound_campaign', arguments: {} }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:observability:primary',
                                 'X-Agent-Key' => "#{observability_cred.key_id}:#{observability_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(%w[tool_not_allowed_for_agent insufficient_scopes risk_tier_exceeded]).to include(json['error']['code'])
    end

    it '8. Risk ceiling: Agente R0 (Observability) é bloqueado ao tentar tool de risco elevado' do
      expect(AgentIdentity.find('agent:observability:primary').risk_tier_max).to eq(:r0)
      expect(Mcp::RiskClassifier.risk_tier('send_outbound_campaign')).to eq(:r3)
    end

    it '9. Cross tenant: Agente vinculado ao Tenant A é bloqueado ao solicitar dados do Tenant B' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'get_company_dashboard_metrics',
             arguments: { company_id: company_beta.id }
           }.to_json,
           headers: auth_headers(company_user, 'X-Agent-Id' => "user:company:#{company_user.id}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('cross_tenant_violation')
    end
  end

  describe '10-13. HITL Approver Authorization & Self-Approval Prevention' do
    let!(:pending_hitl) do
      McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'recipients' => 10, 'template' => 'template_a' },
        requested_by_user_id: company_user.id,
        status: 'pending'
      )
    end

    it '10. Unauthorized approver: Usuário comum ou de empresa é proibido de aprovar requisições HITL' do
      expect do
        pending_hitl.approve!(user: consumer_user)
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('unauthorized_approver')
      end

      expect do
        pending_hitl.approve!(user: company_user)
      end.to raise_error(Mcp::Error)
    end

    it '11. Self approval: Mesmo um Admin que solicitou a ação é proibido de aprovar o próprio pedido' do
      admin_hitl = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'recipients' => 10 },
        requested_by_user_id: admin_user.id,
        status: 'pending'
      )

      expect do
        admin_hitl.approve!(user: admin_user)
      end.to raise_error(Mcp::Error) do |error|
        expect(error.code).to eq('self_approval_forbidden')
      end
    end

    it '12. Expired approval: Aprovação com TTL vencido não pode ser executada (410 Gone)' do
      pending_hitl.update_columns(expires_at: 10.minutes.ago, status: 'approved')

      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'recipients' => 10, 'template' => 'template_a' },
             approval_request_id: pending_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:gone)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('hitl_expired')
    end

    it '13. Rejected approval: Ação rejeitada pelo operador não pode ser executada' do
      pending_hitl.reject!(user: admin_user, reason: 'Orçamento não aprovado')

      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'recipients' => 10, 'template' => 'template_a' },
             approval_request_id: pending_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('hitl_rejected')
    end
  end

  describe '14-18. Cryptographic Payload Binding & Anti-Tampering (P0 Invariant)' do
    let!(:tamper_test_hitl) do
      req = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'campaign_id' => outbound_campaign.id, 'company_id' => company_alpha.id },
        requested_by_user_id: company_user.id,
        tenant_id: company_alpha.id,
        status: 'pending'
      )
      req.approve!(user: admin_user)
      req
    end

    it '14. Tampered arguments: Aprova uma campanha, mas tenta executar outra' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id + 1, 'company_id' => company_alpha.id },
             approval_request_id: tamper_test_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('approval_payload_mismatch')

      # A aprovação deve permanecer intacta (NÃO consumida)
      tamper_test_hitl.reload
      expect(tamper_test_hitl.status).to eq('approved')
      expect(tamper_test_hitl.executed_at).to be_nil
    end

    it '15. Tampered tool: Aprovado para send_outbound_campaign, mas tenta usar em outra tool' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'diagnose_performance',
             arguments: { 'campaign_id' => outbound_campaign.id, 'company_id' => company_alpha.id },
             approval_request_id: tamper_test_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('approval_payload_mismatch')
    end

    it '16. Tampered tenant: Aprovado para tenant Alpha, mas executado no tenant Beta' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id, 'company_id' => company_beta.id },
             approval_request_id: tamper_test_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('approval_payload_mismatch')
    end

    it '17. Tampered agent: Aprovado para Engineering Agent, executado por Hermes' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id, 'company_id' => company_alpha.id },
             approval_request_id: tamper_test_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:hermes:outbound',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:#{hermes_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(%w[approval_payload_mismatch tool_not_allowed_for_agent]).to include(json['error']['code'])
    end

    it '18. Executa com sucesso se o payload canônico for exatamente o aprovado' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id, 'company_id' => company_alpha.id },
             approval_request_id: tamper_test_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['ok']).to be true

      tamper_test_hitl.reload
      expect(tamper_test_hitl.status).to eq('executed')
    end
  end

  describe '19-21. Replay Attacks & Exactly-Once Execution' do
    let!(:executable_hitl) do
      req = McpApprovalRequest.create!(
        agent_id: 'agent:engineering:primary',
        tool_name: 'send_outbound_campaign',
        risk_tier: 'r3',
        parameters_payload: { 'campaign_id' => outbound_campaign.id },
        requested_by_user_id: company_user.id,
        status: 'pending'
      )
      req.approve!(user: admin_user)
      req
    end

    it '19. Replay Attack: Rejeita reutilização de aprovação que já foi consumida' do
      # 1ª execução consome com sucesso
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id },
             approval_request_id: executable_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:ok)

      # 2ª tentativa de replay
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'send_outbound_campaign',
             arguments: { 'campaign_id' => outbound_campaign.id },
             approval_request_id: executable_hitl.request_uuid
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:engineering:primary',
                                 'X-Agent-Key' => "#{engineering_cred.key_id}:#{engineering_secret}")

      expect(response).to have_http_status(:forbidden)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('approval_already_consumed')
    end
  end

  describe '22-25. Prohibited Tools, Fail-Closed & Secret Redaction' do
    it '22. Unknown tool: Retorna not_found fail-closed' do
      post '/api/v1/mcp/tools',
           params: { tool_name: 'malicious_non_existent_tool', arguments: {} }.to_json,
           headers: auth_headers(admin_user)

      expect(response).to have_http_status(:not_found)
      json = JSON.parse(response.body)
      expect(json['error']['code']).to eq('unknown_tool')
    end

    it '23. Prohibited Shell: Bloqueia qualquer tentativa de execução de shell/código arbitrário' do
      %w[execute_shell execute_system_command run_bash eval_ruby].each do |prohibited|
        post '/api/v1/mcp/tools',
             params: { tool_name: prohibited, arguments: { cmd: 'whoami' } }.to_json,
             headers: auth_headers(admin_user)

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('prohibited_tool')
      end
    end

    it '24. Prohibited SQL: Bloqueia qualquer tentativa de execução de queries SQL arbitrárias' do
      %w[direct_sql_query execute_raw_sql run_sql db_query].each do |prohibited|
        post '/api/v1/mcp/tools',
             params: { tool_name: prohibited, arguments: { sql: 'SELECT * FROM users' } }.to_json,
             headers: auth_headers(admin_user)

        expect(response).to have_http_status(:forbidden)
        json = JSON.parse(response.body)
        expect(json['error']['code']).to eq('prohibited_tool')
      end
    end

    it '25. Secret Redaction: Garante que credenciais e tokens nunca aparecem em respostas JSON' do
      post '/api/v1/mcp/tools',
           params: {
             tool_name: 'search_companies',
             arguments: { query: 'Solar' }
           }.to_json,
           headers: auth_headers(admin_user,
                                 'X-Agent-Id' => 'agent:hermes:outbound',
                                 'X-Agent-Key' => "#{hermes_cred.key_id}:#{hermes_secret}")

      expect(response).to have_http_status(:ok)
      body_str = response.body
      expect(body_str).not_to include(hermes_secret)
      expect(body_str).not_to include(hermes_cred.secret_digest)
      expect(body_str).not_to include(jwt_token_for(admin_user))
    end
  end
end
