# frozen_string_literal: true

module ChatSessionAuthorization
  extend ActiveSupport::Concern

  included do
    rescue_from Chat::SessionAccessToken::InvalidToken, with: :invalid_chat_session_token
  end

  private

  def authorize_chat_session!(session)
    if current_user
      return true if session.user_id.present? && session.user_id == current_user.id
      return Chat::SessionAccessToken.verify(request.headers['X-Chat-Session-Token'].to_s, session: session) if session.user_id.blank?
      return render_error_response(message: 'Sessão não pertence ao usuário atual.', status: :forbidden,
                                   code: 'FORBIDDEN_SESSION')
    end

    token = request.headers['X-Chat-Session-Token'].presence
    return invalid_chat_session_token unless token
    Chat::SessionAccessToken.verify(token, session: session)
    true
  end

  def invalid_chat_session_token
    render_error_response(message: 'Token de sessão inválido ou expirado.', status: :forbidden,
                          code: 'INVALID_SESSION_TOKEN')
  end
end
