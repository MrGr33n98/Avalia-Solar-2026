# frozen_string_literal: true

class ChatSessionChannel < ApplicationCable::Channel
  def subscribed
    session_id = verify_session_token(params[:session_token])
    @session = ChatSession.find_by(id: session_id)
    reject unless @session && @session.id.to_s == params[:session_id].to_s

    stream_from Chat::InboxBroadcastService.session_stream(@session.id)
  end

  def typing(data)
    return unless @session

    Chat::InboxBroadcastService.typing(session: @session, actor: 'customer', typing: data['typing'])
  end

  private

  def verify_session_token(token)
    Rails.application.message_verifier(:chat_session_realtime).verify(token.to_s)
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    nil
  end
end
