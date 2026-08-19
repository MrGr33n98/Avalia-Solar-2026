# frozen_string_literal: true

module Messaging
  class P2pInboxAdapter
    class << self
      def adapt(conversation, viewer:)
        role = conversation.viewer_role_for(viewer)
        unread = conversation.unread_count_for_role(role)

        last_msg = conversation.direct_messages.order(created_at: :desc).first || conversation.direct_messages.last

        participant = if role == 'Company'
                        {
                          type: 'buyer',
                          id: conversation.user_id,
                          name: conversation.user&.name || 'Cliente',
                          email: conversation.user&.email,
                          avatar_url: conversation.user&.avatar_url
                        }
                      else
                        {
                          type: 'company',
                          id: conversation.company_id,
                          name: conversation.company&.name || 'Empresa',
                          logo_url: conversation.company&.logo_url
                        }
                      end

        last_message_dto = if last_msg
                             {
                               id: last_msg.id,
                               body: last_msg.body,
                               sender_type: last_msg.sender_type,
                               created_at: last_msg.created_at.iso8601,
                               read_at: last_msg.read_at&.iso8601
                             }
                           else
                             nil
                           end

        sla_dto = if conversation.sla_due_at.present?
                    {
                      due_at: conversation.sla_due_at.iso8601,
                      breached: Time.current > conversation.sla_due_at
                    }
                  else
                    nil
                  end

        InboxItemSerializer.format_dto(
          composite_id: "p2p:#{conversation.id}",
          channel: 'p2p',
          status: conversation.status,
          company_id: conversation.company_id,
          participant: participant,
          last_message: last_message_dto,
          unread_count: unread,
          sla: sla_dto,
          lead: nil,
          updated_at: conversation.last_message_at || conversation.updated_at || conversation.created_at
        )
      end
    end
  end
end
