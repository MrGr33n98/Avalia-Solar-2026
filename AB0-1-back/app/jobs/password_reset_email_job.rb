# frozen_string_literal: true

# Send password reset email - TASK-018
class PasswordResetEmailJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :polynomially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(user_id, reset_token)
    user = User.find(user_id)
    UserMailer.password_reset(user, reset_token).deliver_later
    Rails.logger.info "✅ Password reset email sent to user #{user.id}"
  end
end
