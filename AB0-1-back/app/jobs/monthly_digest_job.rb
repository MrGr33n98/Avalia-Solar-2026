# frozen_string_literal: true

# Send monthly digest to companies - TASK-018
class MonthlyDigestJob < ApplicationJob
  queue_as :mailers
  
  def perform(company_id = nil)
    if company_id
      # Send digest for specific company
      send_digest_for_company(company_id)
    else
      # Send digest for all companies
      Company.find_each do |company|
        MonthlyDigestJob.perform_later(company.id)
      end
    end
  end

  private

  def send_digest_for_company(company_id)
    company = Company.find(company_id)
    
    # Get reviews from last month
    reviews = company.reviews.where('created_at >= ?', 1.month.ago)
    
    # Only send if there are reviews
    return if reviews.empty?
    
    CompanyMailer.monthly_digest(company, reviews).deliver_now
    Rails.logger.info "✅ Monthly digest sent to company #{company.id}"
  rescue ActiveRecord::RecordNotFound
    Rails.logger.warn "Company #{company_id} not found, skipping digest"
  end
end
