# frozen_string_literal: true

# Send monthly digest to companies - TASK-018
class CompanyMonthlyDigestJob < ApplicationJob
  queue_as :mailers
  
  retry_on StandardError, wait: :exponentially_longer, attempts: 3
  discard_on ActiveRecord::RecordNotFound

  def perform(company_id)
    company = Company.find(company_id)
    
    # Get reviews from last month
    reviews = company.reviews.where(
      created_at: 1.month.ago.beginning_of_month..1.month.ago.end_of_month
    )
    
    # Only send if there are reviews
    return if reviews.empty?
    
    CompanyMailer.monthly_digest(company, reviews).deliver_now
    
    Rails.logger.info "✅ Monthly digest sent to company #{company.id} (#{reviews.count} reviews)"
  rescue StandardError => e
    Rails.logger.error "❌ Failed to send monthly digest to company #{company_id}: #{e.message}"
    raise
  end
end
