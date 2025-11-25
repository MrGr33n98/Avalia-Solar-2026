# frozen_string_literal: true

# Remove expired sessions - TASK-017
class SessionCleanupJob < ApplicationJob
  queue_as :low
  
  def perform
    Rails.logger.info 'Starting session cleanup...'
    
    # Clean up expired sessions older than 30 days
    cutoff_date = 30.days.ago
    
    # This depends on your session store
    # Example for database sessions:
    # Session.where('updated_at < ?', cutoff_date).delete_all
    
    Rails.logger.info 'Session cleanup completed'
  end
end
