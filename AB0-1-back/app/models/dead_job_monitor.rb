# app/models/dead_job_monitor.rb

class DeadJobMonitor
  def self.check_health
    dead_set = Sidekiq::DeadSet.new

    dead_jobs_by_queue = dead_set.group_by { |job| job['queue'] }

    alerts = []
    dead_jobs_by_queue.each do |queue, jobs|
      next unless jobs.count > 10

      alerts << {
        queue: queue,
        dead_jobs: jobs.count,
        oldest: jobs.last['failed_at'],
        severity: jobs.count > 50 ? 'CRITICAL' : 'WARNING'
      }
    end

    # Send to monitoring if critical
    notify_ops(alerts) if alerts.any?

    alerts
  end

  def self.notify_ops(alerts)
    Rails.logger.error({
      type: 'DEAD_JOB_ALERT',
      alerts: alerts,
      timestamp: Time.current
    }.to_json)

    # Sentry integration
    return unless defined?(Sentry)

    Sentry.capture_message(
      "Dead Job Alert: #{alerts.inspect}",
      level: 'error',
      tags: { monitoring: 'sidekiq_dlq' }
    )
  end

  def self.retry_dead_jobs(queue = nil, limit = 10)
    dead_set = Sidekiq::DeadSet.new

    retried = 0
    dead_set.each do |job|
      next if queue && job['queue'] != queue
      next if retried >= limit

      # Retry the job
      Sidekiq::Api.new.retry_job(job)
      retried += 1
    end

    Rails.logger.info("Retried #{retried} dead jobs from queue: #{queue || 'all'}")
    retried
  end

  def self.purge_old_dead_jobs(older_than_days = 30)
    dead_set = Sidekiq::DeadSet.new
    cutoff = (Time.current - older_than_days.days).to_i

    purged = 0
    dead_set.each do |job|
      if job['failed_at'].to_i < cutoff
        job.delete
        purged += 1
      end
    end

    Rails.logger.info("Purged #{purged} dead jobs older than #{older_than_days} days")
    purged
  end
end
