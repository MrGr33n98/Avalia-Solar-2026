require 'net/http'
require 'json'

class P2pChatPushNotificationJob < ApplicationJob
  EXPO_PUSH_URL = URI('https://exp.host/--/api/v2/push/send')

  queue_as :default

  def perform(message_id)
    message = DirectMessage.includes(conversation: :company).find(message_id)
    recipient_ids = recipient_user_ids(message)
    return if recipient_ids.blank?

    tokens = PushToken.active.where(user_id: recipient_ids).pluck(:token)
    return if tokens.blank?

    payload = tokens.map do |token|
      {
        to: token,
        sound: 'default',
        title: push_title(message),
        body: push_body(message),
        data: {
          type: 'p2p_message',
          conversation_id: message.conversation_id,
          company_id: message.conversation.company_id
        }
      }
    end

    response = Net::HTTP.post(EXPO_PUSH_URL, payload.to_json, 'Content-Type' => 'application/json')
    Rails.logger.warn("[P2P Push] Expo returned #{response.code}: #{response.body}") unless response.is_a?(Net::HTTPSuccess)
  rescue StandardError => e
    Rails.logger.error("[P2P Push] #{e.class}: #{e.message}")
    raise
  end

  private

  def recipient_user_ids(message)
    if message.sender_type == 'User'
      message.conversation.company_recipient_user_ids
    else
      [message.conversation.user_id]
    end
  end

  def push_title(message)
    message.sender_type == 'User' ? 'Nova mensagem de cliente' : message.conversation.company.name
  end

  def push_body(message)
    body = message.body.to_s.strip
    return body.truncate(120) if body.present?

    'Novo anexo recebido no chat'
  end
end
