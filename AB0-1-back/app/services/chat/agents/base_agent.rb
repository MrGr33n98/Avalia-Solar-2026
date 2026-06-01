# frozen_string_literal: true

module Chat
  module Agents
    class BaseAgent
      def self.process(session:, user_message:, router_state:, context: nil)
        raise NotImplementedError, "#{self.name} deve implementar o método .process"
      end

      protected

      def self.agent_response(content:, metadata:, intent:, next_agent:, should_trigger_lead:, fallback_triggered: false, error: nil)
        {
          content: content,
          metadata: metadata,
          intent: intent,
          next_agent: next_agent,
          success: error.nil? && !fallback_triggered,
          should_trigger_lead: should_trigger_lead,
          fallback_triggered: fallback_triggered,
          error: error
        }
      end

      def self.fallback_response(error: nil)
        agent_response(
          content: 'No momento não consegui buscar essa informação. Posso ajudar com algo mais ou prefere falar com um consultor?',
          metadata: {},
          intent: 'fallback',
          next_agent: nil,
          should_trigger_lead: false,
          fallback_triggered: true,
          error: error&.message
        )
      end
    end
  end
end
