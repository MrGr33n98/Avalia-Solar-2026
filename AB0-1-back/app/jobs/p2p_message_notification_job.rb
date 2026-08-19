# frozen_string_literal: true

class P2pMessageNotificationJob < ApplicationJob
  queue_as :default

  def perform(direct_message_id)
    message = DirectMessage.find_by(id: direct_message_id)
    return unless message
    return if message.read_at.present?

    conversation = message.conversation
    return unless conversation

    recipients = if message.sender_type == 'Company'
                   [conversation.user].compact
                 else
                   User.where(id: conversation.company_recipient_user_ids).to_a
                 end

    return if recipients.blank?

    sender_name = message.sender_type == 'Company' ? conversation.company.name : conversation.user.name

    recipients.each do |recipient|
      already_notified = Notification.exists?(
        user_id: recipient.id,
        category: 'messages',
        actionable_type: 'DirectMessage',
        actionable_id: message.id
      )
      next if already_notified

      destination_url = if recipient.company_user? && recipient.active_membership_for?(conversation.company_id)
                          "/review-dashboard/messages?conversation_id=#{conversation.id}"
                        else
                          "/chat?conversation_id=#{conversation.id}"
                        end

      Notification.create!(
        user: recipient,
        notification_type: 'p2p_message_received',
        category: 'messages',
        title: "Nova mensagem de #{sender_name}",
        message: message.body.to_s.truncate(100).presence || 'Novo anexo recebido',
        actionable_type: 'DirectMessage',
        actionable_id: message.id,
        company_id: conversation.company_id,
        conversation_id: conversation.id,
        data: {
          direct_message_id: message.id,
          destination_url: destination_url
        }
      )
    end
  end
end

