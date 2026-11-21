# frozen_string_literal: true

module CompanyAi
  class Publisher
    def self.call(assistant:, version:, actor:)
      raise ArgumentError, 'VERSION_MISMATCH' unless version.company_ai_assistant_id == assistant.id
      raise ArgumentError, 'UNAUTHORIZED_ACTOR' unless actor

      gate = FeatureGate.call(company: assistant.company)
      raise ArgumentError, gate.reason unless gate.allowed?

      result = WorkflowValidator.call(version.definition)
      raise ArgumentError, result.errors.join(', ') unless result.valid?

      assistant.with_lock do
        raise ArgumentError, 'VERSION_NOT_DRAFT' unless version.reload.status == 'draft'
        assistant.workflow_versions.where(status: 'published').update_all(status: 'archived', updated_at: Time.current)
        version.update!(status: 'published', published_at: Time.current)
        assistant.update!(active_version_id: version.id, enabled: true)
        CompanyAiAuditEvent.create!(
          company: assistant.company, company_ai_assistant: assistant,
          actor_user_id: actor.id, action: 'workflow_published',
          workflow_version_id: version.id, metadata: { version_number: version.version_number }
        )
      end

      version
    end
  end
end
