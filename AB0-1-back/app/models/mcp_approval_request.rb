# frozen_string_literal: true

class McpApprovalRequest < ApplicationRecord
  STATUSES = %w[pending approved rejected executed expired].freeze
  RISK_TIERS = %w[r0 r1 r2 r3 r4].freeze
  DEFAULT_TTL = 1.hour

  validates :request_uuid, presence: true, uniqueness: true
  validates :agent_id, presence: true
  validates :tool_name, presence: true
  validates :risk_tier, presence: true, inclusion: { in: RISK_TIERS }
  validates :status, presence: true, inclusion: { in: STATUSES }
  validates :requested_at, presence: true
  validates :expires_at, presence: true
  validates :payload_digest, presence: true

  belongs_to :requested_by_user, class_name: 'User', optional: true
  belongs_to :approved_by_user, class_name: 'User', optional: true
  belongs_to :tenant, class_name: 'Company', foreign_key: :tenant_id, optional: true

  before_validation :set_defaults, on: :create
  after_create_commit :emit_requested_event!

  scope :active_pending, -> { where(status: 'pending').where('expires_at > ?', Time.current) }
  scope :pending_unsnoozed, -> { active_pending.where('snoozed_until IS NULL OR snoozed_until <= ?', Time.current) }
  scope :snoozed, -> { active_pending.where('snoozed_until > ?', Time.current) }
  scope :approved_ready, -> { where(status: 'approved').where('expires_at > ?', Time.current) }
  scope :high_risk, -> { where(risk_tier: %w[r3 r4]) }
  scope :expiring_soon, ->(threshold = 30.minutes) { active_pending.where('expires_at <= ?', Time.current + threshold) }
  scope :for_agent, ->(agent_id) { where(agent_id: agent_id.to_s) }
  scope :for_tenant, ->(tenant_id) { where(tenant_id: tenant_id) }
  scope :recent_first, -> { order(created_at: :desc) }

  def pending?
    status == 'pending' && !expired?
  end

  def approved?
    status == 'approved' && !expired?
  end

  def rejected?
    status == 'rejected'
  end

  def executed?
    status == 'executed'
  end

  def expired?
    status == 'expired' || (status == 'pending' && expires_at <= Time.current) || (status == 'approved' && expires_at <= Time.current)
  end

  def snoozed?
    pending? && snoozed_until.present? && snoozed_until > Time.current
  end

  # Autorização de Aprovação e Prevenção de Auto-Aprovação com Lock Atômico
  def approve!(user:)
    with_lock do
      raise Mcp::Error.new(code: 'unauthorized_approver', message: 'Aprovador deve ser um usuário autenticado.', status: :unauthorized) unless user

      # 1. Validação de Auto-Aprovação Proibida
      if requested_by_user_id.present? && requested_by_user_id == user.id
        raise Mcp::Error.new(
          code: 'self_approval_forbidden',
          message: 'Auto-aprovação proibida: O solicitante da ação não pode aprovar o próprio pedido.',
          status: :forbidden
        )
      end

      # 2. Validação de Capacidade do Aprovador (Apenas Admin / Staff autorizado)
      unless user_authorized_for_approval?(user)
        raise Mcp::Error.new(
          code: 'unauthorized_approver',
          message: 'Usuário não possui privilégios de governança necessários para revisar/aprovar solicitações HITL.',
          status: :forbidden
        )
      end

      # 3. Validação de Estado
      if expired?
        update_column(:status, 'expired') if status != 'expired'
        raise Mcp::Error.new(code: 'hitl_expired', message: 'A solicitação expirou e não pode mais ser aprovada.', status: :gone)
      end

      unless pending?
        raise Mcp::Error.new(code: 'invalid_approval_state', message: "Apenas solicitações pendentes podem ser aprovadas (estado atual: #{status}).", status: :conflict)
      end

      update!(
        status: 'approved',
        approved_by_user_id: user.id,
        metadata: metadata.merge(
          approved_at: Time.current.iso8601,
          approver_email: user.email,
          approver_role: user.respond_to?(:role) ? user.role : nil
        )
      )

      emit_domain_event!('mcp.approval.approved', user_id: user.id)
    end
  end

  def reject!(user:, reason: nil)
    with_lock do
      raise Mcp::Error.new(code: 'unauthorized_approver', message: 'Operador deve ser um usuário autenticado.', status: :unauthorized) unless user

      unless user_authorized_for_approval?(user)
        raise Mcp::Error.new(
          code: 'unauthorized_approver',
          message: 'Usuário não possui privilégios de governança necessários para rejeitar solicitações HITL.',
          status: :forbidden
        )
      end

      if expired?
        update_column(:status, 'expired') if status != 'expired'
        raise Mcp::Error.new(code: 'hitl_expired', message: 'A solicitação expirou e não pode mais ser rejeitada.', status: :gone)
      end

      unless pending?
        raise Mcp::Error.new(code: 'invalid_approval_state', message: "Apenas solicitações pendentes podem ser rejeitadas (estado atual: #{status}).", status: :conflict)
      end

      update!(
        status: 'rejected',
        approved_by_user_id: user.id,
        rejection_reason: reason.presence || 'Rejeitado pelo operador humano de governança.',
        metadata: metadata.merge(
          rejected_at: Time.current.iso8601,
          rejector_email: user.email
        )
      )

      emit_domain_event!('mcp.approval.rejected', user_id: user.id, reason: rejection_reason)
    end
  end

  # Snooze de fila: posterga visualização da aprovação sem estender expires_at
  def snooze!(user:, until_time:, reason: nil)
    with_lock do
      raise Mcp::Error.new(code: 'unauthorized_approver', message: 'Operador deve ser um usuário autenticado.', status: :unauthorized) unless user

      unless user_authorized_for_approval?(user)
        raise Mcp::Error.new(
          code: 'unauthorized_approver',
          message: 'Usuário não possui privilégios de governança necessários para adiar solicitações HITL.',
          status: :forbidden
        )
      end

      if expired?
        update_column(:status, 'expired') if status != 'expired'
        raise Mcp::Error.new(code: 'hitl_expired', message: 'A solicitação expirou e não pode ser adiada.', status: :gone)
      end

      unless pending?
        raise Mcp::Error.new(code: 'invalid_approval_state', message: "Apenas solicitações pendentes podem ser adiadas (estado atual: #{status}).", status: :conflict)
      end

      parsed_time = until_time.is_a?(Time) || until_time.is_a?(ActiveSupport::TimeWithZone) ? until_time : Time.zone.parse(until_time.to_s)
      if parsed_time.blank? || parsed_time <= Time.current
        raise Mcp::Error.new(code: 'invalid_snooze_time', message: 'O tempo de snooze deve ser uma data/hora futura válida.', status: :bad_request)
      end

      update!(
        snoozed_until: parsed_time,
        metadata: metadata.merge(
          snoozed_at: Time.current.iso8601,
          snoozed_by_user_id: user.id,
          snooze_reason: reason.presence || 'Adiado operacionalmente pelo operador.'
        )
      )

      emit_domain_event!('mcp.approval.snoozed', user_id: user.id, snoozed_until: parsed_time.iso8601, reason: reason)
    end
  end

  def unsnooze!(user:)
    with_lock do
      raise Mcp::Error.new(code: 'unauthorized_approver', message: 'Operador deve ser um usuário autenticado.', status: :unauthorized) unless user

      unless user_authorized_for_approval?(user)
        raise Mcp::Error.new(code: 'unauthorized_approver', message: 'Usuário não possui privilégios para desmarcar snooze.', status: :forbidden)
      end

      update!(
        snoozed_until: nil,
        metadata: metadata.merge(unsnoozed_at: Time.current.iso8601, unsnoozed_by_user_id: user.id)
      )
    end
  end

  # Consumo Exactly-Once com Lock Transacional de Linha (SELECT FOR UPDATE)
  def consume_execution!(agent_id:, tool_name:, risk_tier:, arguments: {}, tenant_id: nil, execution_id: nil)
    with_lock do
      # 1. Validação de Estado Atômico
      if status == 'executed'
        raise Mcp::Error.new(
          code: 'approval_already_consumed',
          message: 'Esta aprovação HITL já foi consumida por uma execução prévia e não pode ser reutilizada (Replay Attack bloqueado).',
          status: :forbidden,
          details: { request_uuid: request_uuid, executed_at: executed_at, execution_id: self.execution_id }
        )
      end

      if status == 'rejected'
        raise Mcp::Error.new(
          code: 'hitl_rejected',
          message: "Ação rejeitada pelo operador humano. Motivo: #{rejection_reason}",
          status: :forbidden,
          details: { request_uuid: request_uuid, rejection_reason: rejection_reason }
        )
      end

      if expired? || status == 'expired'
        update_column(:status, 'expired') if status != 'expired'
        raise Mcp::Error.new(
          code: 'hitl_expired',
          message: 'A solicitação de aprovação HITL expirou.',
          status: :gone,
          details: { request_uuid: request_uuid, expires_at: expires_at }
        )
      end

      unless status == 'approved'
        raise Mcp::Error.new(
          code: 'hitl_pending',
          message: "A solicitação de aprovação HITL não está aprovada (status: #{status}).",
          status: :accepted,
          details: { request_uuid: request_uuid, status: status }
        )
      end

      # 2. Validação Estrita de Identidade, Ferramenta, Risco e Tenant Server-Side
      if self.agent_id != agent_id.to_s
        raise Mcp::Error.new(
          code: 'approval_payload_mismatch',
          message: "Divergência de Agente: Aprovação pertence ao agente '#{self.agent_id}', mas a execução foi solicitada por '#{agent_id}'.",
          status: :forbidden,
          details: { expected_agent: self.agent_id, received_agent: agent_id }
        )
      end

      if self.tool_name != tool_name.to_s
        raise Mcp::Error.new(
          code: 'approval_payload_mismatch',
          message: "Divergência de Ferramenta: Aprovação emitida para '#{self.tool_name}', mas a execução foi tentada para '#{tool_name}'.",
          status: :forbidden,
          details: { expected_tool: self.tool_name, received_tool: tool_name }
        )
      end

      if self.risk_tier != risk_tier.to_s.downcase
        raise Mcp::Error.new(
          code: 'approval_payload_mismatch',
          message: 'Divergência de Risco: Nível de risco difere do aprovado.',
          status: :forbidden,
          details: { expected_risk: self.risk_tier, received_risk: risk_tier }
        )
      end

      if self.tenant_id.present? && self.tenant_id != tenant_id.to_i
        raise Mcp::Error.new(
          code: 'approval_payload_mismatch',
          message: "Divergência de Tenant: Aprovação vinculada ao tenant #{self.tenant_id}, mas recebido #{tenant_id}.",
          status: :forbidden,
          details: { expected_tenant: self.tenant_id, received_tenant: tenant_id }
        )
      end

      # 3. Validação Criptográfica de Imutabilidade do Payload (Anti-Tampering)
      is_valid_digest = Mcp::CanonicalPayloadService.secure_verify?(
        expected_digest: payload_digest,
        agent_id: self.agent_id,
        tool_name: self.tool_name,
        risk_tier: self.risk_tier,
        arguments: arguments,
        requester_user_id: requested_by_user_id,
        tenant_id: self.tenant_id
      )

      unless is_valid_digest
        raise Mcp::Error.new(
          code: 'approval_payload_mismatch',
          message: 'Divergência Criptográfica de Payload: Os argumentos da execução não correspondem exatamente aos parâmetros aprovados pelo operador humano.',
          status: :forbidden,
          details: {
            request_uuid: request_uuid,
            expected_digest: payload_digest
          }
        )
      end

      # 4. Transição Atômica para Executed
      assigned_exec_id = execution_id.presence || self.execution_id.presence || SecureRandom.uuid
      update!(
        status: 'executed',
        executed_at: Time.current,
        execution_id: assigned_exec_id,
        metadata: metadata.merge(
          executed_at: Time.current.iso8601,
          execution_tenant_id: tenant_id,
          execution_id: assigned_exec_id
        )
      )

      emit_domain_event!('mcp.execution.completed', execution_id: assigned_exec_id, tenant_id: tenant_id)
      assigned_exec_id
    end
  end

  def mark_executed!(exec_id: nil)
    raise Mcp::Error.new(code: 'invalid_execution_state', message: 'Solicitação deve estar aprovada para ser executada.') unless status == 'approved'

    assigned_id = exec_id.presence || execution_id.presence || SecureRandom.uuid
    update!(
      status: 'executed',
      executed_at: Time.current,
      execution_id: assigned_id,
      metadata: metadata.merge(executed_at: Time.current.iso8601, execution_id: assigned_id)
    )
  end

  def safe_details_for_viewer
    {
      id: id,
      request_uuid: request_uuid,
      agent_id: agent_id,
      tool_name: tool_name,
      risk_tier: risk_tier,
      status: status,
      tenant_id: tenant_id,
      tenant_name: tenant&.name,
      requested_by_user_id: requested_by_user_id,
      requester_name: requested_by_user&.name || requested_by_user&.email,
      approved_by_user_id: approved_by_user_id,
      approver_name: approved_by_user&.name || approved_by_user&.email,
      rejection_reason: rejection_reason,
      snoozed_until: snoozed_until&.iso8601,
      snoozed: snoozed?,
      execution_id: execution_id,
      parameters_payload: Mcp::CanonicalPayloadService.canonicalize_value(parameters_payload || {}),
      payload_digest: payload_digest,
      requested_at: requested_at&.iso8601,
      expires_at: expires_at&.iso8601,
      executed_at: executed_at&.iso8601,
      created_at: created_at&.iso8601,
      updated_at: updated_at&.iso8601,
      metadata: metadata.except('raw_secret', 'secret', 'token', 'authorization')
    }
  end

  private

  def user_authorized_for_approval?(user)
    return true if user.admin?
    return true if user.respond_to?(:has_role?) && user.has_role?(:admin)
    return true if user.respond_to?(:has_permission?) && user.has_permission?(:mcp_approvals_review)
    return true if defined?(::Sales::AuthorizationService) && ::Sales::AuthorizationService.can?(user: user, permission: 'mcp.approvals.review')

    false
  end

  def set_defaults
    self.request_uuid ||= SecureRandom.uuid
    self.requested_at ||= Time.current
    self.expires_at ||= (requested_at + DEFAULT_TTL)
    self.status ||= 'pending'
    self.parameters_payload ||= {}
    self.metadata ||= {}

    if payload_digest.blank?
      self.payload_digest = Mcp::CanonicalPayloadService.generate_digest(
        agent_id: agent_id,
        tool_name: tool_name,
        risk_tier: risk_tier,
        arguments: parameters_payload,
        requester_user_id: requested_by_user_id,
        tenant_id: tenant_id
      )
    end
  end

  def emit_requested_event!
    emit_domain_event!('mcp.approval.requested', requested_by_user_id: requested_by_user_id)
  end

  def emit_domain_event!(event_type, extra_payload = {})
    return unless defined?(DomainEvent)

    DomainEvent.create!(
      event_type: event_type,
      aggregate_type: self.class.name,
      aggregate_id: id.to_s,
      occurred_at: Time.current,
      payload: {
        request_uuid: request_uuid,
        agent_id: agent_id,
        tool_name: tool_name,
        risk_tier: risk_tier,
        status: status,
        tenant_id: tenant_id,
        payload_digest: payload_digest
      }.merge(extra_payload)
    )
  rescue StandardError => e
    Rails.logger.warn("[DomainEvent] Failed to emit #{event_type} for #{request_uuid}: #{e.message}")
  end
end
