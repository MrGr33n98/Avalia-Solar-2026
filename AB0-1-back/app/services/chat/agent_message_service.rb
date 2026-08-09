# frozen_string_literal: true

module Chat
  class AgentMessageService
    def self.call(session:, agent:, content: '', client_message_id: nil, attachment_ids: [])
      new(session: session, agent: agent).call(content: content, client_message_id: client_message_id, attachment_ids: attachment_ids)
    end

    def initialize(session:, agent:)
      @session = session
      @agent = agent
    end

    def call(content: '', client_message_id: nil, attachment_ids: [])
      clean_content = content.to_s.strip
      raise ActiveRecord::RecordInvalid, @session if clean_content.blank? && attachment_ids.blank?

      message = nil
      @session.with_lock do
        existing = if client_message_id.present?
                     @session.chat_messages.find_by(client_message_id: client_message_id)
                   end
        return existing if existing

        @session.take_over!(agent: @agent) unless @session.mode == 'human_manual'
        message = @session.chat_messages.new(
          role: 'agent',
          sender: @agent,
          content: clean_content,
          client_message_id: client_message_id.presence,
          safety_status: 'clean'
        )
        message.attachments.attach(attachment_ids) if attachment_ids.present?
        message.save!
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
