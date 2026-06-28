# app/jobs/concerns/sidekiq_retry_strategies.rb

module SidekiqRetryStrategies
  # Circuit breaker for jobs
  def self.circuit_breaker(job_class, exception = nil)
    key = "job_circuit_breaker:#{job_class}"
    Rails.cache.read(key) || should_open_circuit?(job_class, exception)
  end

  def self.should_open_circuit?(job_class, _exception)
    failure_key = "job_failures:#{job_class}:#{Time.current.hour}"

    # Use Rails.cache for consistency and safety during boot
    failures = Rails.cache.read(failure_key).to_i

    # Open circuit if >10 failures in 1 hour
    if failures > 10
      Rails.cache.write("job_circuit_breaker:#{job_class}", true, expires_in: 5.minutes)
      true
    else
      false
    end
  end

  def self.increment_failure(job_class)
    failure_key = "job_failures:#{job_class}:#{Time.current.hour}"
    current = Rails.cache.read(failure_key).to_i
    Rails.cache.write(failure_key, current + 1, expires_in: 1.hour)
  end

  # Fallback action when circuit is open
  def self.handle_circuit_open(job_class, job_args)
    Rails.logger.error({
      type: 'CIRCUIT_BREAKER_OPEN',
      job: job_class,
      args: job_args,
      reason: 'Too many consecutive failures',
      action: 'Job moved to DLQ'
    }.to_json)
  end
end
