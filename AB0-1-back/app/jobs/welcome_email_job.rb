# frozen_string_literal: true

# Send welcome email to new users - TASK-018
class WelcomeEmailJob < ApplicationJob
  queue_as :mailers
  
  # Retry with exponential backoff
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  
  # Discard if user is deleted before email is sent
  discard_on ActiveRecord::RecordNotFound do |job, error|
    Rails.logger.warn "User #{job.arguments.first} not found, discarding welcome email"
  end

  def perform(user_id)
    user = User.find(user_id)
    
    # Don't send if already sent
    return if user.welcome_email_sent_at.present?
    
    # Send email
    UserMailer.welcome(user).deliver_now
    
    # Mark as sent (add this column to users table)
    # user.update_column(:welcome_email_sent_at, Time.current)
    
    Rails.logger.info "✅ Welcome email sent to user #{user.id} (#{user.email})"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send welcome email to user #{user_id}: #{e.message}"
    raise # Re-raise to trigger retry
  end
end
