# frozen_string_literal: true

class PresenceChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user

    @user_type = current_user.class.name
    @user_id = current_user.id

    stream_from "presence:#{@user_type.downcase}:#{@user_id}"
    
    Messaging::PresenceService.touch(@user_type, @user_id)
  end

  def unsubscribed
    return unless current_user
    Messaging::PresenceService.mark_offline(@user_type, @user_id)
  end

  def touch
    Messaging::PresenceService.touch(@user_type, @user_id) if current_user
  end
end
