# frozen_string_literal: true

module Messaging
  class AiInboxAdapter
    class << self
      def adapt(session)
        last_msg = session.chat_messages.order(created_at: :desc, id: :desc).first

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
                               created_at: last_msg.created_at.respond_to?(:iso8601) ? last_msg.created_at.iso8601 : last_msg.created_at.to_s
                             }
                           end

        lead_dto = if lead
                     {
                       id: lead.id,
                       name: lead.name,
                       email: lead.email,
                       phone: lead.phone,
                       city: lead.try(:city),
                       state: lead.try(:state),
                       score: lead.try(:lead_score) || lead.try(:score),
                       temperature: lead.try(:lead_temperature) || lead.try(:temperature),
                       monthly_bill: lead.try(:monthly_bill),
                       solution_type: lead.try(:solution_type),
                       project_type: lead.try(:project_type),
                       recommended_next_action: lead.try(:recommended_next_action)
                     }
                   end

        capabilities = {
          can_reply: session.inbox_status != 'archived',
          can_resolve: session.inbox_status != 'archived',
          can_archive: session.inbox_status != 'archived',
          can_takeover: session.mode != 'human_manual',
          can_return_to_bot: session.mode == 'human_manual',
          can_handoff_whatsapp: lead&.phone.present?,
          can_attach: false
        }

        sla = if session.waiting_for_agent? && session.human_requested_at.present?
                {
                  waiting_since: session.human_requested_at.iso8601,
                  waiting_seconds: (Time.current - session.human_requested_at).to_i
                }
              end

        unread_count = session.respond_to?(:company_unread_count) ? session.company_unread_count.to_i : 0

        InboxItemSerializer.format_dto(
          composite_id: "ai:#{session.id}",
          channel: 'ai',
          status: session.inbox_status || 'active',
          company_id: session.company_id,
          participant: participant,
          last_message: last_message_dto,
          unread_count: unread_count,
          sla: sla,
          lead: lead_dto,
          capabilities: capabilities,
          updated_at: session.last_message_at || session.updated_at || session.created_at
        )
      end
    end
  end
end
