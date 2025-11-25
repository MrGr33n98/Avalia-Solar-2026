# frozen_string_literal: true

# Recalculate company ratings - TASK-017
class UpdateRatingsJob < ApplicationJob
  queue_as :default
  
  def perform
    Rails.logger.info 'Starting ratings update...'
    
    companies_updated = 0
    
    Company.find_each do |company|
      # Calculate average rating from reviews
      avg_rating = company.reviews.average(:rating)
      
      if avg_rating && company.rating != avg_rating
        company.update(rating: avg_rating)
        companies_updated += 1
      end
    end
    
    Rails.logger.info "Updated ratings for #{companies_updated} companies"
  end
end
