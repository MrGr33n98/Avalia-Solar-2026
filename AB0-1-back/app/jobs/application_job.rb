# frozen_string_literal: true

# Base class for all jobs - TASK-017
class ApplicationJob < ActiveJob::Base
  # Automatically retry jobs that encounter a DeadlockDetected exception.
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  # Retry on database connection errors
  retry_on ActiveRecord::ConnectionNotEstablished, wait: 5.seconds, attempts: 3

  # Discard jobs that encounter a RecordNotFound exception.
  discard_on ActiveJob::DeserializationError
  discard_on ActiveRecord::RecordNotFound

  # Default queue
  queue_as :default

  # Instrumentation
  before_perform do |job|
    Rails.logger.info "Starting job: #{job.class.name} with args: #{job.arguments.inspect}"
  end

  after_perform do |job|
    Rails.logger.info "Finished job: #{job.class.name}"
  end

  around_perform do |job, block|
    start_time = Time.current
    block.call
    duration = Time.current - start_time
    Rails.logger.info "Job #{job.class.name} took #{duration.round(2)}s"
  end

  # Error handling
  rescue_from(StandardError) do |exception|
    Rails.logger.error "Job failed: #{self.class.name}"
    Rails.logger.error "Error: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")
    
    # TODO: Send to Sentry when TASK-006 is implemented
    # Sentry.capture_exception(exception) if defined?(Sentry)
    
    raise exception # Re-raise to trigger retry logic
  end
end
