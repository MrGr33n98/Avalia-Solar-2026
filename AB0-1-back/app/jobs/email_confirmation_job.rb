# frozen_string_literal: true

# Send email confirmation - TASK-018
class EmailConfirmationJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :polynomially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(user_id, confirmation_token)
    user = User.find(user_id)
    UserMailer.email_confirmation(user, confirmation_token).deliver_now
    Rails.logger.info "✅ Email confirmation sent to user #{user.id}"
  end
end
