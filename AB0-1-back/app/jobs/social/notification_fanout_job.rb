# frozen_string_literal: true

module Social
  class NotificationFanoutJob < ApplicationJob
    queue_as :default

    def perform(event_type, target_user_id, notifiable_type, notifiable_id, title:, body:)
      target_user = User.find_by(id: target_user_id)
      return unless target_user

      notifiable = notifiable_type.constantize.find_by(id: notifiable_id)
      return unless notifiable

      Notification.create!(
        user: target_user,
        notifiable: notifiable,
        notification_type: event_type,
        category: 'community',
        title: title,
        message: body,
        sent_at: Time.current
      )
    end
  end
end
