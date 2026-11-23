# frozen_string_literal: true

module CompanyAi
  # Bind the tenant at session creation. Caller-provided page_url/metadata is never authoritative.
  class SessionStarter
    class Unavailable < StandardError; end

    def self.call(company:, user: nil)
      gate = FeatureGate.call(company: company)
      raise Unavailable, gate.reason unless gate.allowed?

      assistant = CompanyAiAssistant.find_by(company_id: company.id, enabled: true)
      version = assistant&.published_workflow
      raise Unavailable, 'ASSISTANT_UNAVAILABLE' unless assistant && version

      ChatSession.transaction do
        session = ChatSession.create!(
          company: company, user: user, source_page: 'company_brand_page',
          vertical: 'company_ai', mode: 'bot_only', inbox_status: 'archived',
          metadata: { 'company_ai_assistant_id' => assistant.id,
                      'company_ai_workflow_version_id' => version.id,
                      'company_ai_current_node_id' => version.definition.fetch('start_node_id') }
        )
        message = session.chat_messages.create!(
          role: 'assistant', safety_status: 'clean',
          content: assistant.greeting
        )
        [session, message]
      end
    end
  end
end
