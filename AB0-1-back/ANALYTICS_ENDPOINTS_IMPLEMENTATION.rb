# ================================================
# ANALYTICS ENDPOINTS - Implementation Guide
# ================================================
#
# Copy these methods to their respective controllers
# and add the routes to config/routes.rb
#
# ================================================

# ================================================
# 1. app/controllers/api/v1/companies_controller.rb
# ================================================

# Add these methods to CompaniesController

# GET /api/v1/companies/:id/analytics/historical
def analytics_historical
  @company = Company.find(params[:id])
  days = params[:days]&.to_i || 30
  
  data = generate_historical_data(@company, days)
  
  render json: { data: data }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Company not found' }, status: :not_found
end

# GET /api/v1/companies/:id/analytics/reviews
def analytics_reviews
  @company = Company.find(params[:id])
  reviews = @company.reviews.includes(:user)
  
  distribution = reviews.group(:rating).count
  
  render json: {
    total_reviews: reviews.count,
    average_rating: @company.rating_avg || 0,
    rating_distribution: {
      5 => distribution[5.0] || 0,
      4 => distribution[4.0] || 0,
      3 => distribution[3.0] || 0,
      2 => distribution[2.0] || 0,
      1 => distribution[1.0] || 0
    },
    recent_reviews: reviews.order(created_at: :desc).limit(10).map do |review|
      {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        user_name: review.user&.name || 'Anônimo',
        created_at: review.created_at,
        verified: review.verified
      }
    end,
    sentiment_analysis: calculate_sentiment(reviews)
  }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Company not found' }, status: :not_found
end

# GET /api/v1/companies/:id/analytics/competitors
def analytics_competitors
  @company = Company.find(params[:id])
  category_id = params[:category_id]
  
  # Get competitors in the same category
  competitors = Company
    .joins(:categories)
    .where(categories: { id: category_id })
    .where.not(id: @company.id)
    .where(status: 'active')
    .order(rating_avg: :desc)
    .limit(10)
  
  total_companies = competitors.count
  company_position = competitors.index { |c| c.rating_avg <= @company.rating_avg } || total_companies
  
  render json: {
    competitors: competitors.map.with_index(1) do |competitor, index|
      {
        company_id: competitor.id,
        company_name: competitor.name,
        rating: competitor.rating_avg || 0,
        reviews_count: competitor.reviews_count || 0,
        market_position: index,
        category_share: calculate_market_share(competitor, category_id)
      }
    end,
    company_position: company_position + 1,
    total_competitors: total_companies
  }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Company not found' }, status: :not_found
end

# GET /api/v1/companies/:id/analytics/traffic
def analytics_traffic
  @company = Company.find(params[:id])
  days = params[:days]&.to_i || 30
  
  # Mock data - replace with real tracking data
  sources = generate_traffic_sources(@company, days)
  
  render json: { sources: sources }
rescue ActiveRecord::RecordNotFound
  render json: { error: 'Company not found' }, status: :not_found
end

private

def generate_historical_data(company, days)
  data = []
  
  (days - 1).downto(0).each do |i|
    date = i.days.ago.to_date
    
    # Get actual data from database
    views = company.profile_views_on(date) rescue 0
    clicks = company.cta_clicks_on(date) rescue 0
    leads = company.leads.where(
      created_at: date.beginning_of_day..date.end_of_day
    ).count
    
    total_views = views > 0 ? views : 1
    conversion = ((leads.to_f / total_views) * 100).round(2)
    
    data << {
      date: date.iso8601,
      views: views,
      clicks: clicks,
      leads: leads,
      conversion: conversion
    }
  end
  
  data
end

def calculate_sentiment(reviews)
  return { positive: 0, neutral: 0, negative: 0 } if reviews.empty?
  
  total = reviews.count.to_f
  positive = reviews.where('rating >= ?', 4).count
  neutral = reviews.where(rating: 3).count
  negative = reviews.where('rating < ?', 3).count
  
  {
    positive: ((positive / total) * 100).round(1),
    neutral: ((neutral / total) * 100).round(1),
    negative: ((negative / total) * 100).round(1)
  }
end

def calculate_market_share(company, category_id)
  total_reviews = Review.joins(company: :categories)
    .where(categories: { id: category_id })
    .count
    
  return 0 if total_reviews.zero?
  
  company_reviews = company.reviews.count
  ((company_reviews.to_f / total_reviews) * 100).round(2)
end

def generate_traffic_sources(company, days)
  # Mock data - replace with real tracking from analytics service
  total_views = company.profile_views_count || 0
  
  [
    {
      source: 'Busca Orgânica',
      visits: (total_views * 0.45).to_i,
      percentage: 45,
      conversion_rate: 8.5
    },
    {
      source: 'Direto',
      visits: (total_views * 0.25).to_i,
      percentage: 25,
      conversion_rate: 12.3
    },
    {
      source: 'Redes Sociais',
      visits: (total_views * 0.18).to_i,
      percentage: 18,
      conversion_rate: 5.2
    },
    {
      source: 'Referências',
      visits: (total_views * 0.12).to_i,
      percentage: 12,
      conversion_rate: 6.8
    }
  ]
end

# ================================================
# 2. app/controllers/api/v1/analytics_controller.rb
# ================================================
# Create this new controller:

module Api
  module V1
    class AnalyticsController < BaseController
      # POST /api/v1/analytics/track
      def track
        company = Company.find(params[:company_id])
        event_type = params[:event_type]
        metadata = params[:metadata] || {}
        
        # Increment counters
        case event_type
        when 'view'
          increment_counter(company, :profile_views_count)
        when 'click'
          increment_counter(company, :cta_clicks_count)
        when 'whatsapp_click'
          increment_counter(company, :whatsapp_clicks_count)
        when 'lead'
          # Already tracked via Lead creation
        end
        
        # Optional: Store detailed event log
        AnalyticsEvent.create!(
          company: company,
          event_type: event_type,
          metadata: metadata,
          tracked_at: Time.current
        )
        
        head :ok
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Company not found' }, status: :not_found
      rescue StandardError => e
        Rails.logger.error "Analytics tracking error: #{e.message}"
        head :ok # Don't fail the request even if tracking fails
      end
      
      private
      
      def increment_counter(company, counter_name)
        # Use Redis for real-time counting if available
        if defined?(Redis) && Rails.cache.respond_to?(:redis)
          date_key = Time.current.to_date.to_s
          redis_key = "company:#{company.id}:#{counter_name}:#{date_key}"
          Rails.cache.increment(redis_key, 1)
          
          # Async job to sync to database
          SyncAnalyticsCounterJob.perform_later(company.id, counter_name, date_key)
        else
          # Fallback to direct database increment
          company.increment!(counter_name)
        end
      end
    end
  end
end

# ================================================
# 3. app/models/analytics_event.rb (Optional)
# ================================================
# If you want to store detailed event logs:

class AnalyticsEvent < ApplicationRecord
  belongs_to :company
  
  validates :event_type, presence: true
  validates :tracked_at, presence: true
  
  # Scopes
  scope :recent, -> { where('tracked_at >= ?', 30.days.ago) }
  scope :by_type, ->(type) { where(event_type: type) }
  scope :by_date_range, ->(start_date, end_date) {
    where(tracked_at: start_date..end_date)
  }
  
  # Class methods
  def self.aggregate_by_date(company_id, event_type, days = 30)
    by_type(event_type)
      .where(company_id: company_id)
      .where('tracked_at >= ?', days.days.ago)
      .group("DATE(tracked_at)")
      .count
  end
end

# Migration:
# rails g migration CreateAnalyticsEvents company:references event_type:string metadata:jsonb tracked_at:datetime
# 
# class CreateAnalyticsEvents < ActiveRecord::Migration[7.0]
#   def change
#     create_table :analytics_events do |t|
#       t.references :company, null: false, foreign_key: true
#       t.string :event_type, null: false
#       t.jsonb :metadata, default: {}
#       t.datetime :tracked_at, null: false
#       
#       t.timestamps
#     end
#     
#     add_index :analytics_events, :event_type
#     add_index :analytics_events, :tracked_at
#     add_index :analytics_events, [:company_id, :event_type]
#   end
# end

# ================================================
# 4. Add methods to Company model
# ================================================
# app/models/company.rb

class Company < ApplicationRecord
  # ... existing code ...
  
  # Analytics methods
  def profile_views_on(date)
    analytics_events
      .by_type('view')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end
  
  def cta_clicks_on(date)
    analytics_events
      .by_type('click')
      .where(tracked_at: date.beginning_of_day..date.end_of_day)
      .count
  end
  
  def historical_stats(days = 30)
    Rails.cache.fetch("company_#{id}_historical_#{days}_days", expires_in: 1.hour) do
      calculate_historical_stats(days)
    end
  end
  
  private
  
  def calculate_historical_stats(days)
    # Implementation...
  end
end

# ================================================
# 5. config/routes.rb
# ================================================
# Add these routes:

Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # ... existing routes ...
      
      # Analytics tracking
      post 'analytics/track', to: 'analytics#track'
      
      # Company analytics
      resources :companies do
        member do
          get 'analytics/historical', to: 'companies#analytics_historical'
          get 'analytics/reviews', to: 'companies#analytics_reviews'
          get 'analytics/competitors', to: 'companies#analytics_competitors'
          get 'analytics/traffic', to: 'companies#analytics_traffic'
        end
      end
    end
  end
end

# ================================================
# 6. Background Job for syncing counters (Optional)
# ================================================
# app/jobs/sync_analytics_counter_job.rb

class SyncAnalyticsCounterJob < ApplicationJob
  queue_as :default
  
  def perform(company_id, counter_name, date_key)
    company = Company.find(company_id)
    redis_key = "company:#{company_id}:#{counter_name}:#{date_key}"
    
    # Get count from Redis
    count = Rails.cache.read(redis_key) || 0
    
    # Update database
    company.update_column(counter_name, company[counter_name] + count)
    
    # Clear Redis counter
    Rails.cache.delete(redis_key)
  rescue ActiveRecord::RecordNotFound
    Rails.logger.warn "Company #{company_id} not found for counter sync"
  end
end

# ================================================
# 7. Add columns to companies table (if not exist)
# ================================================
# Migration:
# rails g migration AddAnalyticsCountersToCompanies

class AddAnalyticsCountersToCompanies < ActiveRecord::Migration[7.0]
  def change
    add_column :companies, :profile_views_count, :integer, default: 0
    add_column :companies, :cta_clicks_count, :integer, default: 0
    add_column :companies, :whatsapp_clicks_count, :integer, default: 0
    
    add_index :companies, :profile_views_count
    add_index :companies, :cta_clicks_count
  end
end

# ================================================
# USAGE EXAMPLES
# ================================================

# From frontend:
# 1. Track a page view
# await analyticsApi.trackEvent({
#   company_id: 123,
#   event_type: 'view',
#   metadata: { page: '/companies/123' }
# });

# 2. Get historical data
# const data = await analyticsApi.getHistoricalData(123, 30);

# 3. Get review analytics
# const reviews = await analyticsApi.getReviewAnalytics(123);

# From Rails console:
# company = Company.find(1)
# company.profile_views_on(Date.today)
# company.historical_stats(30)

# ================================================
# TESTING
# ================================================

# Test the endpoints:
# curl -X GET http://localhost:3001/api/v1/companies/1/analytics/historical?days=30 \
#   -H "Authorization: Bearer YOUR_TOKEN"

# curl -X POST http://localhost:3001/api/v1/analytics/track \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer YOUR_TOKEN" \
#   -d '{"company_id": 1, "event_type": "view", "metadata": {}}'
