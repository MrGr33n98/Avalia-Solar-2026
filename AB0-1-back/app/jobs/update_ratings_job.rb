# frozen_string_literal: true

# Recalculate company ratings - TASK-017
class UpdateRatingsJob < ApplicationJob
  queue_as :default
  
  def perform
    Rails.logger.info 'Starting full metrics and ratings update...'
    
    companies_updated = 0
    categories_updated = 0
    
    # 1. Update all company ratings and counts
    Company.find_each do |company|
      company.recalculate_rating_cache!
      companies_updated += 1
    end
    
    # 2. Update all category metrics
    Category.find_each do |category|
      category.update_metrics!
      categories_updated += 1
    end
    
    # 3. Clear cache to reflect new data
    Rails.cache.clear
    
    Rails.logger.info "Full update finished: #{companies_updated} companies and #{categories_updated} categories updated. Cache cleared."
  end
end
