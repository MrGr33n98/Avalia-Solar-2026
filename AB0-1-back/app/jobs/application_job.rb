# frozen_string_literal: true

# Base class for all jobs - TASK-017
class ApplicationJob < ActiveJob::Base
  # Retry strategy: exponential backoff with max 5 attempts
  sidekiq_retry_in do |count|
    case count
    when 0 then 1.minute         # 1m
    when 1 then 5.minutes        # 5m
    when 2 then 30.minutes       # 30m
    when 3 then 2.hours          # 2h
    when 4 then 6.hours          # 6h
    else
      :kill  # Stop trying after 5 attempts
    end
  end

  # Deadletter configuration
  sidekiq_options dead: true, retry: 5

  # Automatically retry jobs that encounter a DeadlockDetected exception.
  retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3

  # Retry on database connection errors
  retry_on ActiveRecord::ConnectionNotEstablished, wait: 5.seconds, attempts: 3

  # Discard jobs that encounter a RecordNotFound exception.
  discard_on ActiveJob::DeserializationError
  discard_on ActiveRecord::RecordNotFound

  # Default queue
  queue_as :default

  # Structured error handling
  rescue_from StandardError do |exception|
    log_job_failure(exception)
    notify_error_tracking(exception)
    raise exception # Re-raise to trigger retry logic
  end

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

  private

  def log_job_failure(exception)
    Rails.logger.error({
      job_class: self.class.name,
      job_id: job_id,
      error_class: exception.class.name,
      error_message: exception.message,
      backtrace: exception.backtrace&.first(3)
    }.to_json)
  end

  def notify_error_tracking(exception)
    # Sentry/Rollbar integration
    Sentry.capture_exception(exception, tags: { job: self.class.name }) if defined?(Sentry)
  end
end

