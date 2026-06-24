# frozen_string_literal: true

class ConversationChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user
    
    @conversation = Conversation.find_by(id: params[:conversation_id])
    reject unless @conversation

    if can_access_conversation?
      stream_from "conversation:#{@conversation.id}"
    else
      reject
    end
  end

  def typing(data)
    return unless current_user && @conversation && can_access_conversation?

    P2pChat::Broadcaster.typing(
      @conversation,
      actor: current_user,
      typing: ActiveModel::Type::Boolean.new.cast(data['typing'])
    )
  end

  private

  def can_access_conversation?
    return true if current_user.id == @conversation.user_id
    return true if current_user.company_user? && current_user.active_membership_for?(@conversation.company_id)
    return true if current_user.admin?

    false
  end
end
