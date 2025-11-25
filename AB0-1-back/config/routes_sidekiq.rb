# Sidekiq Web UI routes - TASK-017
# Add this to your config/routes.rb

require 'sidekiq/web'
require 'sidekiq-scheduler/web'

Rails.application.routes.draw do
  # Mount Sidekiq Web UI
  # WARNING: In production, protect this with authentication!
  
  # Example with Devise:
  # authenticate :user, ->(user) { user.admin? } do
  #   mount Sidekiq::Web => '/sidekiq'
  # end
  
  # For development, no authentication:
  if Rails.env.development?
    mount Sidekiq::Web => '/sidekiq'
  end
  
  # For production, add authentication constraint:
  # constraint = lambda { |request| 
  #   request.env['warden'].authenticate? && 
  #   request.env['warden'].user.admin?
  # }
  # constraints constraint do
  #   mount Sidekiq::Web => '/sidekiq'
  # end
end
