# frozen_string_literal: true

module Revenue
  class FounderInboxService < BaseService
    def self.list(user:, arguments: {})
      new(user: user, arguments: arguments).list
    end

    def self.refresh(user:, arguments: {})
      new(user: user, arguments: arguments).refresh
    end

    def list
      scope = Sales::FounderInboxItem.where(company_id: tenant_company_id!).order(observed_at: :desc)
      scope = scope.where(status: arguments[:status]) if arguments[:status].present?
      scope = scope.where(approval_required: true) if arguments[:needs_approval]

      {
        records: scope.limit(bounded_limit(default: 30, maximum: 100)).map { |item| serialize(item) },
        total_count: scope.count
      }
    end

    def refresh
      company = tenant_company!
      created_or_updated = []

      tenant_scope.opportunities.open.includes(:account, :tasks).find_each do |opportunity|
        next unless opportunity.next_activity_at.blank? && opportunity.tasks.pending.none?

        created_or_updated << Sales::FounderInboxItem.upsert_open!(
          company: company,
          dedupe_key: "opportunity:#{opportunity.id}:missing_next_action",
          attributes: {
            account: opportunity.account,
            opportunity: opportunity,
            kind: 'follow_up_due',
            title: 'Oportunidade sem próxima ação',
            why: 'A oportunidade está aberta, mas não possui tarefa pendente nem próxima atividade agendada.',
            evidence: [{ type: 'opportunity', id: opportunity.id, status: opportunity.status }],
            recommended_action: 'Preparar follow-up interno para revisão comercial.',
            risk_tier: 'r1',
            approval_required: false,
            action_payload: { opportunity_id: opportunity.id },
            observed_at: Time.current
          }
        )
      end

      McpApprovalRequest.where(tenant_id: company.id, status: 'pending').find_each do |approval|
        created_or_updated << Sales::FounderInboxItem.upsert_open!(
          company: company,
          dedupe_key: "approval:#{approval.request_uuid}",
          attributes: {
            mcp_approval_request: approval,
            agent_id: approval.agent_id,
            kind: 'approval_required',
            title: "Aprovação pendente: #{approval.tool_name}",
            why: 'Uma ação controlada do agente aguarda revisão humana antes da execução.',
            evidence: [{ type: 'mcp_approval_request', request_uuid: approval.request_uuid,
                         tool_name: approval.tool_name }],
            recommended_action: 'Revisar o payload, o risco e os efeitos colaterais antes de aprovar ou rejeitar.',
            risk_tier: approval.risk_tier,
            approval_required: true,
            action_payload: { approval_request_id: approval.request_uuid },
            observed_at: approval.requested_at || approval.created_at
          }
        )
      end

      { refreshed_count: created_or_updated.size, records: created_or_updated.map { |item| serialize(item) } }
    end

    private

    def serialize(item)
      {
        id: item.id,
        kind: item.kind,
        status: item.status,
        title: item.title,
        why: item.why,
        evidence: item.evidence,
        recommended_action: item.recommended_action,
        risk_tier: item.risk_tier,
        approval_required: item.approval_required,
        account_id: item.sales_account_id,
        opportunity_id: item.sales_opportunity_id,
        approval_request_id: item.mcp_approval_request&.request_uuid,
        observed_at: item.observed_at.iso8601
      }
    end
  end
end
