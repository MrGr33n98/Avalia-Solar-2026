# frozen_string_literal: true

# Send account update notification - TASK-018
class AccountUpdatedEmailJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(user_id, changes)
    user = User.find(user_id)
    
    # Only notify about important changes
    important_changes = filter_important_changes(changes)
    return if important_changes.empty?
    
    UserMailer.account_updated(user, important_changes).deliver_now
    
    Rails.logger.info "✅ Account update email sent to user #{user.id}"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send account update email: #{e.message}"
    raise
  end

  private

  def filter_important_changes(changes)
    important_fields = %w[email password phone_number]
    changes.select { |key, _| important_fields.include?(key) }
  end
end
