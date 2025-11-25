# frozen_string_literal: true

# Notify company about new review - TASK-018
class NewReviewNotificationJob < ApplicationJob
  queue_as :default
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 5
  discard_on ActiveRecord::RecordNotFound

  def perform(review_id)
    review = Review.find(review_id)
    company = review.company
    
    # Send email to company
    CompanyMailer.new_review(company, review).deliver_now
    
    # TODO: Create in-app notification when TASK-019 is implemented
    
    Rails.logger.info "✅ Review notification sent for review #{review.id}"
  end
end
