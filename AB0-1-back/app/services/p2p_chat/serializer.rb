module P2pChat
  class Serializer
    class << self
      include Rails.application.routes.url_helpers

      def conversation(conversation, viewer: nil, viewer_role: nil)
        role = viewer_role || conversation.viewer_role_for(viewer)
        last_message = if conversation.association(:direct_messages).loaded?
                         conversation.direct_messages.sort_by { |m| m.created_at || Time.at(0) }.last
                       else
                         conversation.direct_messages.order(created_at: :desc).first
                       end

        {
          id: conversation.id,
          user_id: conversation.user_id,
          company_id: conversation.company_id,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          user_name: conversation.user&.name,
          company_name: conversation.company&.name,
          company_logo: company_logo_url(conversation.company),
          company_avatar: company_logo_url(conversation.company),
          status: conversation.status,
          last_message: last_message&.body,
          last_message_at: conversation.last_message_at || last_message&.created_at,
          unread_count: conversation.unread_count_for_role(role),
          user_unread_count: conversation.user_unread_count.to_i,
          company_unread_count: conversation.company_unread_count.to_i,
          user_last_read_at: conversation.user_last_read_at,
          company_last_read_at: conversation.company_last_read_at,
          sla_due_at: conversation.sla_due_at,
          resolved_at: conversation.resolved_at,
          blocked_at: conversation.blocked_at,
          blocked_by_type: conversation.blocked_by_type,
          blocked_by_id: conversation.blocked_by_id,
          block_reason: conversation.block_reason,
          report_count: conversation.report_count.to_i
        }
      end

      def message(message)
        attachments = message.attachments.map { |attachment| attachment_json(attachment) }

        {
          id: message.id,
          conversation_id: message.conversation_id,
          body: message.body.to_s,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          client_message_id: message.client_message_id,
          delivered_at: message.delivered_at,
          created_at: message.created_at,
          read_at: message.read_at,
          attachments: attachments,
          attachment_url: attachments.first&.dig(:url)
        }
      end

      def event(event)
        {
          id: event.id,
          conversation_id: event.conversation_id,
          event_type: event.event_type,
          actor_id: event.actor_id,
          actor_name: event.actor&.name,
          metadata: event.metadata || {},
          created_at: event.created_at
        }
      end

      private

      def company_logo_url(company)
        return nil unless company&.logo&.attached?

        rails_blob_url(company.logo, **url_options)
      rescue StandardError
        nil
      end

      def attachment_json(attachment)
        {
          id: attachment.id,
          filename: attachment.filename.to_s,
          content_type: attachment.content_type,
          byte_size: attachment.byte_size,
          url: rails_blob_url(attachment, **url_options)
        }
      rescue StandardError
        {
          id: attachment.id,
          filename: attachment.filename.to_s,
          content_type: attachment.content_type,
          byte_size: attachment.byte_size,
          url: nil
        }
      end

      def url_options
        Rails.application.routes.default_url_options.presence || { host: 'localhost', port: 3001 }
      end
    end
  end
end
