# frozen_string_literal: true

module Chat
  class AgentMessageService
    def self.call(session:, agent:, content:, client_message_id: nil)
      new(session:, agent:).call(content:, client_message_id:)
    end

    def initialize(session:, agent:)
      @session = session
      @agent = agent
    end

    def call(content:, client_message_id: nil)
      clean_content = content.to_s.strip
      raise ActiveRecord::RecordInvalid, @session if clean_content.blank?

      message = nil
      @session.with_lock do
        existing = if client_message_id.present?
                     @session.chat_messages.find_by(client_message_id: client_message_id)
                   end
        return existing if existing

        @session.take_over!(agent: @agent) unless @session.mode == 'human_manual'
        message = @session.chat_messages.create!(
          role: 'agent',
          sender: @agent,
          content: clean_content,
          client_message_id: client_message_id.presence,
          safety_status: 'clean'
        )
        @session.update!(
          last_message_at: message.created_at,
          last_agent_message_at: message.created_at
        )
      end

      Chat::InboxBroadcastService.message_created(message)
      Chat::InboxBroadcastService.session_updated(@session.reload)
      message
    rescue ActiveRecord::RecordNotUnique
      @session.chat_messages.find_by!(client_message_id: client_message_id)
    end
  end
end
