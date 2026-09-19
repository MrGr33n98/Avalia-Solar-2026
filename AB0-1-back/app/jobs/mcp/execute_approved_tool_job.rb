# frozen_string_literal: true

module Mcp
  class ExecuteApprovedToolJob < ApplicationJob
    queue_as :default

    # Retry configurado para falhas transientes
    retry_on StandardError, wait: :exponentially_longer, attempts: 3 do |job, error|
      record_failure_event!(job.arguments.first, error)
    end

    def perform(approval_request_id:, execution_id: nil, user_id: nil)
      approval_request = McpApprovalRequest.find_by(id: approval_request_id)
      return unless approval_request

      user = User.find_by(id: user_id) if user_id

      # Execução Síncrona Atômica mediada pelo serviço
      ApprovedToolExecutionService.new(
        request_uuid: approval_request.request_uuid,
        user: user,
        execution_id: execution_id,
        force_sync: true
      ).execute_sync!
    rescue StandardError => e
      Rails.logger.error("[MCP_JOB_ERROR] approval_request_id=#{approval_request_id} execution_id=#{execution_id} error=#{e.class}: #{e.message}")
      raise e
    end

    private

    def self.record_failure_event!(job_args, error)
      req_id = job_args.is_a?(Hash) ? job_args[:approval_request_id] : nil
      exec_id = job_args.is_a?(Hash) ? job_args[:execution_id] : nil
      return unless req_id

      approval = McpApprovalRequest.find_by(id: req_id)
      return unless approval

      DomainEvent.create!(
        event_type: 'mcp.execution.failed',
        aggregate_type: 'McpApprovalRequest',
        aggregate_id: approval.id.to_s,
        occurred_at: Time.current,
        payload: {
          request_uuid: approval.request_uuid,
          execution_id: exec_id,
          error: error.message,
          error_class: error.class.name
        }
      ) if defined?(DomainEvent)
    rescue StandardError => e
      Rails.logger.warn("[DomainEvent] Failed to emit mcp.execution.failed: #{e.message}")
    end
  end
end
