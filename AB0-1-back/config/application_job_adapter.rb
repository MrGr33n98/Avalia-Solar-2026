# ActiveJob adapter configuration - TASK-017
# Add this to config/application.rb or config/environments/*.rb

# config/application.rb
Rails.application.configure do
  # Use Sidekiq as the ActiveJob adapter
  config.active_job.queue_adapter = :sidekiq
  
  # Queue name prefix (optional)
  config.active_job.queue_name_prefix = Rails.env
  config.active_job.queue_name_delimiter = '_'
end

# Example for environment-specific:
# config/environments/production.rb
# config.active_job.queue_adapter = :sidekiq

# config/environments/development.rb
# config.active_job.queue_adapter = :sidekiq # or :async for testing

# config/environments/test.rb
# config.active_job.queue_adapter = :test
