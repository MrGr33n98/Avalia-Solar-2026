module P2pChat
  class Broadcaster
    class << self
      def message_created(message)
        conversation = message.conversation
        serialized = Serializer.message(message)

        ActionCable.server.broadcast(
          conversation_stream(conversation.id),
          {
            event: 'message.created',
            conversation_id: conversation.id,
            message: serialized
          }.merge(serialized)
        )

        conversation_updated(conversation)
        P2pChatPushNotificationJob.perform_later(message.id) if defined?(P2pChatPushNotificationJob)
      end

      def message_read(conversation, reader:, read_at:, message_ids:)
        payload = {
          event: 'message.read',
          conversation_id: conversation.id,
          reader_type: conversation.viewer_role_for(reader),
          reader_id: reader.id,
          read_at: read_at,
          message_ids: message_ids
        }

        ActionCable.server.broadcast(conversation_stream(conversation.id), payload)
        conversation_updated(conversation)
      end

      def typing(conversation, actor:, typing:)
        event = typing ? 'typing.started' : 'typing.stopped'

        ActionCable.server.broadcast(
          conversation_stream(conversation.id),
          {
            event: event,
            conversation_id: conversation.id,
            actor_id: actor.id,
            actor_name: actor.name,
            actor_type: conversation.viewer_role_for(actor)
          }
        )
      end

      def conversation_updated(conversation, event: 'conversation.updated')
        user_payload = conversation_payload(conversation, event: event, viewer_role: 'User')
        company_payload = conversation_payload(conversation, event: event, viewer_role: 'Company')

        ActionCable.server.broadcast(user_list_stream(conversation.user_id), user_payload)
        ActionCable.server.broadcast(company_list_stream(conversation.company_id), company_payload)
      end

      def conversation_blocked(conversation)
        ActionCable.server.broadcast(
          conversation_stream(conversation.id),
          {
            event: 'conversation.blocked',
            conversation_id: conversation.id,
            conversation: Serializer.conversation(conversation)
          }
        )
        conversation_updated(conversation, event: 'conversation.blocked')
      end

      def conversation_reported(conversation, report)
        ActionCable.server.broadcast(
          conversation_stream(conversation.id),
          {
            event: 'conversation.reported',
            conversation_id: conversation.id,
            report_id: report.id,
            conversation: Serializer.conversation(conversation)
          }
        )
        conversation_updated(conversation, event: 'conversation.reported')
      end

      private

      def conversation_payload(conversation, event:, viewer_role:)
        {
          event: event,
          conversation_id: conversation.id,
          conversation: Serializer.conversation(conversation, viewer_role: viewer_role)
        }
      end

      def conversation_stream(conversation_id)
        "conversation:#{conversation_id}"
      end

      def user_list_stream(user_id)
        "conversation_list:user:#{user_id}"
      end

      def company_list_stream(company_id)
        "conversation_list:company:#{company_id}"
      end
    end
  end
end
