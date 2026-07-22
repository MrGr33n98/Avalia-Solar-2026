# frozen_string_literal: true

module Chat
  class InboxBroadcastService
    class << self
      def message_created(message)
        session = message.chat_session
        return unless session.company_id.present?

        payload = {
          type: 'inbox.message.created',
          session: session_payload(session),
          message: message_payload(message)
        }

        ActionCable.server.broadcast(session_stream(session.id), payload)
        ActionCable.server.broadcast(company_stream(session.company_id), payload)
      end

      def session_updated(session)
        return unless session.company_id.present?

        payload = { type: 'inbox.session.updated', session: session_payload(session) }
        ActionCable.server.broadcast(session_stream(session.id), payload)
        ActionCable.server.broadcast(company_stream(session.company_id), payload)
      end

      def typing(session:, actor:, typing:)
        payload = {
          type: 'inbox.typing',
          session_id: session.id,
          actor: actor,
          typing: ActiveModel::Type::Boolean.new.cast(typing)
        }
        ActionCable.server.broadcast(session_stream(session.id), payload)
      end

      def session_payload(session)
        lead = session.chat_lead
        {
          id: session.id,
          company_id: session.company_id,
          mode: session.mode,
          status: session.inbox_status,
          unread_count: session.company_unread_count,
          last_message_at: session.last_message_at,
          assigned_agent: session.assigned_agent && {
            id: session.assigned_agent.id,
            name: session.assigned_agent.name
          },
          lead: lead && {
            id: lead.id,
            name: lead.name,
            city: lead.city,
            state: lead.state,
            score: lead.lead_score,
            temperature: lead.lead_temperature
          }
        }
      end

      def message_payload(message)
        {
          id: message.id,
          role: message.role,
          content: message.content,
          sender_id: message.sender_id,
          sender_name: message.sender&.name,
          client_message_id: message.client_message_id,
          created_at: message.created_at
        }
      end

      def company_stream(company_id) = "company:#{company_id}:live_inbox"
      def session_stream(session_id) = "chat_session:#{session_id}:live_inbox"
    end
  end
end
