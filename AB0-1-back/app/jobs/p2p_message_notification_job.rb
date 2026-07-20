# frozen_string_literal: true

class P2pMessageNotificationJob < ApplicationJob
  queue_as :default

  def perform(direct_message_id)
    message = DirectMessage.find_by(id: direct_message_id)
    return unless message
    return if message.read_at.present?

    conversation = message.conversation
    recipient = if message.sender_type == 'Company'
                  conversation.user
                else
                  conversation.company&.user
                end

    return unless recipient

    # Previne duplicata de notificação para a mesma mensagem
    already_notified = Notification.exists?(
      user_id: recipient.id,
      category: 'messages',
      actionable_id: conversation.id
    )
    return if already_notified

    sender_name = message.sender_type == 'Company' ? conversation.company.name : conversation.user.name

    Notification.create!(
      user: recipient,
      notification_type: 'p2p_message_received',
      category: 'messages',
      title: "Nova mensagem de #{sender_name}",
      message: message.body.to_s.truncate(100),
      actionable_type: 'Conversation',
      actionable_id: conversation.id,
      company_id: conversation.company_id,
      conversation_id: conversation.id,
      data: {
        destination_url: "/review-dashboard/messages?conversation_id=#{conversation.id}"
      }
    )
  end
end
