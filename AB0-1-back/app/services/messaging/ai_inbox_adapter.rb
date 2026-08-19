# frozen_string_literal: true

module Messaging
  class AiInboxAdapter
    class << self
      def adapt(session)
        last_msg = session.chat_messages.order(created_at: :desc).first

        lead = session.chat_lead
        participant = {
          type: 'visitor',
          id: session.visitor_id,
          name: lead&.name.presence || session.user&.name || 'Visitante Chat IA',
          email: lead&.email.presence || session.user&.email,
          phone: lead&.phone
        }

        last_message_dto = if last_msg
                             {
                               id: last_msg.id,
                               body: last_msg.content,
                               sender_type: last_msg.role == 'user' ? 'Visitor' : 'Bot',
                               created_at: last_msg.created_at.iso8601
                             }
                           else
                             nil
                           end

        lead_dto = if lead
                     {
                       id: lead.id,
                       score: lead.try(:score),
                       temperature: lead.try(:temperature),
                       city: lead.try(:city),
                       state: lead.try(:state),
                       solution_type: lead.try(:solution_type)
                     }
                   else
                     nil
                   end

        InboxItemSerializer.format_dto(
          composite_id: "ai:#{session.id}",
          channel: 'ai',
          status: session.inbox_status || 'active',
          company_id: session.company_id,
          participant: participant,
          last_message: last_message_dto,
          unread_count: session.unread_by_company? ? 1 : 0,
          sla: nil,
          lead: lead_dto,
          updated_at: session.last_message_at || session.updated_at || session.created_at
        )
      end
    end
  end
end
