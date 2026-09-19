# frozen_string_literal: true

module Mcp
  class AgentAuthorizationService
    attr_reader :tool_name, :arguments, :user, :headers, :params, :agent, :agent_credential

    def initialize(tool_name:, arguments: {}, user: nil, headers: {}, params: {})
      @tool_name = tool_name.to_s
      @arguments = sanitize_hash(arguments).with_indifferent_access
      @user = user
      @headers = headers || {}
      @params = sanitize_hash(params).with_indifferent_access
      @agent = resolve_and_authenticate_agent!
    end

    def authorize!
      # 1. Bloqueio absoluto de ferramentas proibidas por governança (Fail-Closed)
      if RiskClassifier.prohibited?(tool_name)
        raise ::Mcp::Error.new(
          code: 'prohibited_tool',
          message: "A execução da ferramenta '#{tool_name}' é estritamente proibida pelas políticas de governança de segurança.",
          status: :forbidden
        )
      end

      # 2. Validação da identidade e autenticação do agente
      ensure_valid_agent_identity!

      # 3. Whitelist de ferramentas permitidas para o agente
      unless agent.can_execute_tool?(tool_name)
        raise ::Mcp::Error.new(
          code: 'tool_not_allowed_for_agent',
          message: "O agente '#{agent.agent_id}' não possui permissão para executar a ferramenta '#{tool_name}'.",
          status: :forbidden,
          details: { agent_id: agent.agent_id, allowed_tools: agent.allowed_tools }
        )
      end

      # 4. Verificação de escopos exigidos
      required_scopes = RiskClassifier.required_scopes(tool_name)
      unless agent.has_all_scopes?(required_scopes)
        raise ::Mcp::Error.new(
          code: 'insufficient_scopes',
          message: "Escopos insuficientes para executar '#{tool_name}'. Requer: #{required_scopes.join(', ')}.",
          status: :forbidden,
          details: { required_scopes: required_scopes, agent_scopes: agent.scopes }
        )
      end

      # 5. Verificação de teto de risco (Risk Tier Max)
      tool_risk = RiskClassifier.risk_tier(tool_name)
      unless agent.can_handle_risk?(tool_risk)
        raise ::Mcp::Error.new(
          code: 'risk_tier_exceeded',
          message: "Nível de risco '#{tool_risk.to_s.upcase}' excede o limite máximo autorizado para o agente '#{agent.agent_id}' (#{agent.risk_tier_max.to_s.upcase}).",
          status: :forbidden,
          details: { tool_risk: tool_risk, agent_risk_tier_max: agent.risk_tier_max }
        )
      end

      # 6. Isolamento estrito de Tenant
      enforce_tenant_isolation!

      # 7. Portão Human-in-the-Loop (HITL) com Verificação Criptográfica e Exactly-Once Execution
      enforce_hitl_gate!(tool_risk)

      {
        authorized: true,
        agent: agent,
        risk_tier: tool_risk,
        tenant_id: agent.tenant_id,
        agent_credential: agent_credential
      }
    end

    class << self
      def authorize!(tool_name:, arguments: {}, user: nil, headers: {}, params: {})
        new(
          tool_name: tool_name,
          arguments: arguments,
          user: user,
          headers: headers,
          params: params
        ).authorize!
      end
    end

    private

    def sanitize_hash(value)
      return {} if value.blank?
      return value.to_unsafe_h if value.respond_to?(:to_unsafe_h)
      return value.permit!.to_h if value.respond_to?(:permit!)
      return value.to_h if value.respond_to?(:to_h)

      {}
    end

    def header_val(key)
      return nil unless headers

      headers[key].presence ||
        headers[key.downcase].presence ||
        headers["HTTP_#{key.tr('-', '_').upcase}"].presence
    end

    def parse_agent_key_header
      raw_key = header_val('X-Agent-Key') || header_val('Agent-Key')
      raw_secret = header_val('X-Agent-Secret')

      if raw_key.present? && raw_key.include?(':')
        key_id, secret = raw_key.split(':', 2)
        return [key_id.strip, secret.strip]
      end

      [raw_key.presence, raw_secret.presence]
    end

    def resolve_and_authenticate_agent!
      explicit_agent_id = header_val('X-Agent-Id') || params[:agent_id].presence
      client_scopes = parse_client_scopes
      key_id, raw_secret = parse_agent_key_header

      # 1. Caso seja especificado um Registered Agent
      found_agent_identity = AgentIdentity.find(explicit_agent_id) if explicit_agent_id.present?
      if explicit_agent_id.present? && found_agent_identity.present?
        # Exige credencial server-side válida para agentes de sistema (Anti-Spoofing P1)
        if key_id.blank? || raw_secret.blank?
          raise ::Mcp::Error.new(
            code: 'missing_agent_credential',
            message: "Acesso ao agente de sistema '#{explicit_agent_id}' exige credencial server-side válida via header X-Agent-Key.",
            status: :unauthorized
          )
        end

        found_cred = McpAgentCredential.find_by(key_id: key_id)
        if found_cred.blank?
          raise ::Mcp::Error.new(
            code: 'invalid_agent_credential',
            message: 'Credencial de agente inválida ou não encontrada.',
            status: :unauthorized
          )
        end

        if found_cred.revoked?
          raise ::Mcp::Error.new(
            code: 'revoked_agent_credential',
            message: 'A credencial do agente foi revogada.',
            status: :unauthorized
          )
        end

        if found_cred.expired?
          raise ::Mcp::Error.new(
            code: 'expired_agent_credential',
            message: 'A credencial do agente expirou.',
            status: :unauthorized
          )
        end

        authenticated = McpAgentCredential.authenticate(key_id: key_id, raw_secret: raw_secret)
        if authenticated.blank?
          raise ::Mcp::Error.new(
            code: 'invalid_agent_credential',
            message: 'Falha de autenticação da credencial do agente (chave/segredo inválidos).',
            status: :unauthorized
          )
        end

        # Mismatch entre a credencial autenticada e o agent_id alegado
        if authenticated.agent_identity_id != explicit_agent_id
          raise ::Mcp::Error.new(
            code: 'agent_credential_mismatch',
            message: "A credencial informada pertence ao agente '#{authenticated.agent_identity_id}', mas a requisição reivindicou '#{explicit_agent_id}'.",
            status: :forbidden,
            details: { claimed_agent: explicit_agent_id, credential_agent: authenticated.agent_identity_id }
          )
        end

        @agent_credential = authenticated
        return AgentIdentity.find(explicit_agent_id)
      end

      # 2. Caso seja especificado um agente de usuário dinâmico (user:*)
      if explicit_agent_id.present? && explicit_agent_id.start_with?('user:')
        unless user
          raise ::Mcp::Error.new(
            code: 'authentication_required',
            message: 'Autenticação de usuário necessária para invocar agente de usuário.',
            status: :unauthorized
          )
        end

        # Validação de Spoofing entre usuários
        if explicit_agent_id.start_with?('user:admin:') && !user.admin?
          raise ::Mcp::Error.new(
            code: 'agent_spoofing_detected',
            message: 'Usuário não possui privilégios de administrador para reivindicar identidade user:admin.',
            status: :forbidden
          )
        end

        # Validação de ID do usuário
        expected_suffix = ":#{user.id}"
        unless explicit_agent_id.end_with?(expected_suffix)
          raise ::Mcp::Error.new(
            code: 'agent_spoofing_detected',
            message: "Violação de identidade: Usuário #{user.id} tentou reivindicar o agente '#{explicit_agent_id}'.",
            status: :forbidden
          )
        end

        return AgentIdentity.for_user(user, client_scopes: client_scopes, client_agent_id: explicit_agent_id)
      end

      # 3. Caso o explicit_agent_id seja desconhecido
      if explicit_agent_id.present?
        raise ::Mcp::Error.new(
          code: 'unknown_agent',
          message: "Identidade de agente '#{explicit_agent_id}' não reconhecida pelo MCP Platform Core.",
          status: :unauthorized
        )
      end

      # 4. Caso nenhum agent_id explícito tenha sido informado: inferir do usuário logado ou guest
      AgentIdentity.for_user(user, client_scopes: client_scopes)
    end

    def parse_client_scopes
      raw = header_val('X-Agent-Scopes') || params[:scopes]
      return [] if raw.blank?

      raw.is_a?(Array) ? raw : raw.to_s.split(',').map(&:strip)
    end

    def ensure_valid_agent_identity!
      return if agent.present?

      raise ::Mcp::Error.new(
        code: 'authentication_required',
        message: 'Identidade de agente ou autenticação de usuário obrigatória para executar esta ferramenta.',
        status: :unauthorized
      )
    end

    def enforce_tenant_isolation!
      requested_tenant_id = arguments[:company_id].presence || arguments[:tenant_id].presence
      return if requested_tenant_id.blank?

      unless agent.allowed_tenant?(requested_tenant_id)
        raise ::Mcp::Error.new(
          code: 'cross_tenant_violation',
          message: "Violação de isolamento multi-tenant: Agente com escopo no tenant #{agent.tenant_id} tentou acessar recursos do tenant #{requested_tenant_id}.",
          status: :forbidden,
          details: { agent_tenant_id: agent.tenant_id, requested_tenant_id: requested_tenant_id }
        )
      end
    end

    def enforce_hitl_gate!(tool_risk)
      approval_uuid = params[:approval_request_id].presence || arguments[:approval_request_id].presence
      hitl_needed = RiskClassifier.hitl_required?(tool_name, arguments)

      return unless approval_uuid.present? || hitl_needed

      if approval_uuid.present?
        approval_request = McpApprovalRequest.find_by(request_uuid: approval_uuid)

        unless approval_request
          raise ::Mcp::Error.new(
            code: 'invalid_approval_request',
            message: "Solicitação de aprovação HITL '#{approval_uuid}' não foi encontrada.",
            status: :not_found
          )
        end

        # Consome a aprovação com lock transacional exactly-once e verificação criptográfica do payload
        effective_tenant = agent.tenant_id || arguments[:company_id]
        approval_request.consume_execution!(
          agent_id: agent.agent_id,
          tool_name: tool_name,
          risk_tier: tool_risk,
          arguments: arguments.except(:approval_request_id),
          tenant_id: effective_tenant
        )

        return
      end

      # Caso não tenha passado approval_request_id prévio, cria um novo pedido pendente com digest canônico
      effective_tenant = agent.tenant_id || arguments[:company_id]
      clean_args = arguments.except(:approval_request_id)

      new_request = McpApprovalRequest.create!(
        agent_id: agent.agent_id,
        tenant_id: effective_tenant,
        tool_name: tool_name,
        parameters_payload: clean_args,
        risk_tier: tool_risk.to_s,
        status: 'pending',
        requested_by_user_id: user&.id,
        metadata: {
          request_ip: header_val('REMOTE_ADDR') || header_val('X-Forwarded-For'),
          user_agent: header_val('HTTP_USER_AGENT'),
          requested_via: 'mcp_api'
        }
      )

      raise ::Mcp::Error.new(
        code: 'hitl_approval_required',
        message: "A ferramenta '#{tool_name}' possui classificação de risco #{tool_risk.to_s.upcase} e exige aprovação humana (HITL) para execução.",
        status: :accepted,
        details: {
          approval_request_id: new_request.request_uuid,
          tool: tool_name,
          risk_tier: tool_risk,
          status: 'pending',
          expires_at: new_request.expires_at.iso8601,
          payload_digest: new_request.payload_digest
        }
      )
    end
  end
end
