# frozen_string_literal: true

module Mcp
  class ApprovedToolExecutionService
    attr_reader :request_uuid, :user, :custom_execution_id, :force_sync, :approval_request

    def initialize(request_uuid:, user:, execution_id: nil, force_sync: false)
      @request_uuid = request_uuid.to_s
      @user = user
      @custom_execution_id = execution_id.presence
      @force_sync = force_sync
    end

    def call
      load_and_authorize_approval_request!

      # Política de Execução e Idempotência
      exec_policy = ApprovalPolicyService.execution_policy(tool_name: approval_request.tool_name)

      # Caso deva rodar em background via Sidekiq
      if !force_sync && exec_policy[:async_execution_recommended]
        execution_id = custom_execution_id || SecureRandom.uuid
        approval_request.update!(execution_id: execution_id) if approval_request.execution_id.blank?

        Mcp::ExecuteApprovedToolJob.perform_later(
          approval_request_id: approval_request.id,
          execution_id: execution_id,
          user_id: user&.id
        )

        return {
          status: 'queued',
          async: true,
          execution_id: execution_id,
          request_uuid: approval_request.request_uuid,
          tool_name: approval_request.tool_name,
          message: 'Execução durável enfileirada para processamento assíncrono via Sidekiq.'
        }
      end

      # Execução Síncrona Atômica
      execute_sync!
    end

    def execute_sync!
      execution_id = custom_execution_id || approval_request.execution_id.presence || SecureRandom.uuid

      # 1. Consumo Atômico Exclusivo com Verificação Criptográfica e Lock no PostgreSQL
      clean_args = (approval_request.parameters_payload || {}).deep_symbolize_keys.except(:approval_request_id)
      approval_request.consume_execution!(
        agent_id: approval_request.agent_id,
        tool_name: approval_request.tool_name,
        risk_tier: approval_request.risk_tier,
        arguments: clean_args,
        tenant_id: approval_request.tenant_id,
        execution_id: execution_id
      )

      # 2. Despacho para o Domain Service Canônico correspondente
      tool_definition = ::Api::V1::Mcp::ToolsController::TOOL_REGISTRY[approval_request.tool_name]
      unless tool_definition
        raise Mcp::Error.new(
          code: 'unknown_tool',
          message: "Ferramenta '#{approval_request.tool_name}' não possui Domain Service canônico registrado.",
          status: :not_found
        )
      end

      started_at = Process.clock_gettime(Process::CLOCK_MONOTONIC)
      result_data = tool_definition[:service].new(
        arguments: clean_args.merge(_agent_id: approval_request.agent_id),
        user: user || approval_request.requested_by_user,
        tool_name: approval_request.tool_name
      ).call
      duration_ms = ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started_at) * 1000).round

      # 3. Log Estruturado de Auditoria
      log_audit_execution(
        execution_id: execution_id,
        duration_ms: duration_ms,
        outcome: 'SUCCESS'
      )

      {
        status: 'executed',
        async: false,
        execution_id: execution_id,
        request_uuid: approval_request.request_uuid,
        tool_name: approval_request.tool_name,
        data: result_data,
        executed_at: approval_request.executed_at&.iso8601 || Time.current.iso8601
      }
    rescue StandardError => e
      log_audit_execution(
        execution_id: execution_id,
        outcome: 'FAILED',
        error_message: e.message
      )
      raise e
    end

    class << self
      def execute!(request_uuid:, user:, execution_id: nil, force_sync: false)
        new(
          request_uuid: request_uuid,
          user: user,
          execution_id: execution_id,
          force_sync: force_sync
        ).call
      end
    end

    private

    def load_and_authorize_approval_request!
      @approval_request = McpApprovalRequest.find_by(request_uuid: request_uuid)
      unless approval_request
        raise Mcp::Error.new(
          code: 'approval_request_not_found',
          message: "Solicitação de aprovação '#{request_uuid}' não foi encontrada.",
          status: :not_found
        )
      end

      # Validar permissão do executor
      unless user && (user.admin? || has_execution_permission?(user))
        raise Mcp::Error.new(
          code: 'unauthorized_executor',
          message: 'Usuário não possui privilégios de execução no AI Control Plane.',
          status: :forbidden
        )
      end

      # Validar estado para execução
      if approval_request.executed?
        raise Mcp::Error.new(
          code: 'approval_already_consumed',
          message: 'Esta aprovação já foi consumida e executada.',
          status: :conflict,
          details: { execution_id: approval_request.execution_id, executed_at: approval_request.executed_at }
        )
      end

      if approval_request.rejected?
        raise Mcp::Error.new(
          code: 'hitl_rejected',
          message: "Esta solicitação foi rejeitada. Motivo: #{approval_request.rejection_reason}",
          status: :forbidden
        )
      end

      if approval_request.expired?
        raise Mcp::Error.new(
          code: 'hitl_expired',
          message: 'A solicitação de aprovação HITL expirou.',
          status: :gone
        )
      end

      unless approval_request.status == 'approved'
        raise Mcp::Error.new(
          code: 'approval_not_ready',
          message: "A solicitação ainda está no estado '#{approval_request.status}' e requer aprovação prévia.",
          status: :bad_request
        )
      end
    end

    def has_execution_permission?(user)
      return true if user.admin?
      return true if user.respond_to?(:has_role?) && user.has_role?(:admin)
      return true if user.respond_to?(:has_permission?) && (user.has_permission?(:mcp_executions_view) || user.has_permission?(:mcp_approvals_review))
      return true if defined?(::Sales::AuthorizationService) && (
        ::Sales::AuthorizationService.can?(user: user, permission: 'mcp.executions.view') ||
        ::Sales::AuthorizationService.can?(user: user, permission: 'mcp.approvals.review')
      )

      false
    end

    def log_audit_execution(execution_id:, outcome:, duration_ms: nil, error_message: nil)
      audit_payload = {
        event: 'mcp_durable_tool_execution',
        request_uuid: approval_request.request_uuid,
        execution_id: execution_id,
        agent_id: approval_request.agent_id,
        tool_name: approval_request.tool_name,
        risk_tier: approval_request.risk_tier,
        tenant_id: approval_request.tenant_id,
        user_id: user&.id,
        outcome: outcome,
        duration_ms: duration_ms,
        error: error_message
      }.compact

      Rails.logger.info("[MCP_DURABLE_AUDIT] #{audit_payload.to_json}")
    end
  end
end
