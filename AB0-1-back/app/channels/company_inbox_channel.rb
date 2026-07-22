# frozen_string_literal: true

class CompanyInboxChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user

    @company = Company.find_by(id: params[:company_id])
    reject unless @company && authorized_for_company?(@company)

    stream_from Chat::InboxBroadcastService.company_stream(@company.id)
    return if params[:session_id].blank?

    @session = @company.chat_sessions.find_by(id: params[:session_id])
    reject unless @session

    stream_from Chat::InboxBroadcastService.session_stream(@session.id)
  end

  def speak(data)
    session = authorized_session(data['session_id'])
    return unless session

    message = Chat::AgentMessageService.call(
      session: session,
      agent: current_user,
      content: data['content'],
      client_message_id: data['client_message_id']
    )
    transmit(type: 'inbox.message.acknowledged', message: Chat::InboxBroadcastService.message_payload(message))
  rescue ActiveRecord::RecordInvalid => e
    transmit(type: 'inbox.error', code: 'INVALID_MESSAGE', message: e.record.errors.full_messages.to_sentence)
  end

  def typing(data)
    session = authorized_session(data['session_id'])
    return unless session

    Chat::InboxBroadcastService.typing(session: session, actor: 'agent', typing: data['typing'])
  end

  private

  def authorized_for_company?(company)
    current_user.admin? || current_user.active_membership_for?(company.id)
  end

  def authorized_session(session_id)
    return unless @company

    @company.chat_sessions.find_by(id: session_id)
  end
end
