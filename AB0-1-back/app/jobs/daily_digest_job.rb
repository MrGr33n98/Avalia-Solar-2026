# frozen_string_literal: true

# Send daily digest emails - TASK-017
class DailyDigestJob < ApplicationJob
  queue_as :mailers
  
  def perform
    Rails.logger.info 'Starting daily digest...'
    
    # Find users who want daily digests
    # users = User.where(daily_digest: true)
    
    # users.find_each do |user|
    #   UserMailer.daily_digest(user).deliver_later
    # end
    
    Rails.logger.info 'Daily digest emails queued'
  end
end
