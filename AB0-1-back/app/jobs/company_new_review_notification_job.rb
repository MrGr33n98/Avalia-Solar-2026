# frozen_string_literal: true

# Notify company about new review - TASK-018
class CompanyNewReviewNotificationJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(company_id, review_id)
    company = Company.find(company_id)
    review = Review.find(review_id)
    
    # Check if company wants review notifications
    return unless company.email_notifications_enabled?
    
    CompanyMailer.new_review(company, review).deliver_now
    
    Rails.logger.info "✅ New review notification sent to company #{company.id}"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send review notification: #{e.message}"
    raise
  end
end
