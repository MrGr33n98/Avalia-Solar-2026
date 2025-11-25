# frozen_string_literal: true

# Send notifications to multiple users - TASK-019
class BulkNotificationJob < ApplicationJob
  queue_as :low
  
  def perform(user_ids, notification_type, title, options = {})
    Rails.logger.info "Sending bulk notification to #{user_ids.size} users"
    
    user_ids.each do |user_id|
      CreateNotificationJob.perform_later(
        user_id,
        notification_type,
        title,
        options
      )
    end
    
    Rails.logger.info "✅ Bulk notification jobs queued for #{user_ids.size} users"
  end
end
